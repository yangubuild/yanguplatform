/**
 * Conversation Engine — swappable mock layer.
 *
 * Provides the full pipeline that powers Website / WhatsApp / Email / Voice
 * / Internal-knowledge chat: identify context, load agent config, detect
 * language, load history, search knowledge, decide + generate a reply,
 * record everything, and support human handover / return / test scenarios.
 *
 * Everything here works against the in-memory mock DB so it can be swapped
 * for Supabase / real APIs later without any UI change.
 */

import type {
  Conversation, Message, Channel, AgentConfig,
  ConversationDecision, AgentDecision, MessageMeta,
  TestScenario, ConversationOutcome, ConversationStatus, ConversationNote,
} from "./types";

// Lazy import to avoid circular dep with mock.ts consumers.
import { db } from "./mock";

// ─── Language detection (heuristic) ────────────────────────────────────

const LANG_HINTS: Record<string, RegExp[]> = {
  Swahili:    [/\b(habari|jambo|asante|karibu|tafadhali|bei|nataka|nunua|leo)\b/i],
  French:     [/\b(bonjour|merci|s'il vous plait|prix|acheter|comment|oui|non)\b/i],
  Arabic:     [/[\u0600-\u06FF]/],
  Portuguese: [/\b(ola|obrigado|preco|comprar|voce|nao)\b/i],
  Amharic:    [/[\u1200-\u137F]/],
  Yoruba:     [/\b(bawo|se|owo|ra|dupe)\b/i],
};

export function detectLanguage(text: string, fallback = "English"): string {
  for (const [lang, patterns] of Object.entries(LANG_HINTS)) {
    if (patterns.some((p) => p.test(text))) return lang;
  }
  return fallback;
}

// ─── Sentiment (very small heuristic) ──────────────────────────────────

function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const t = text.toLowerCase();
  if (/(angry|terrible|awful|refund|complain|frustrat|not working|broken|hate|useless|urgent|asap)/.test(t)) return "negative";
  if (/(thanks|great|awesome|love|perfect|amazing|good|excellent)/.test(t)) return "positive";
  return "neutral";
}

function detectPriority(text: string, sentiment: string): Conversation["priority"] {
  if (/(urgent|asap|now|immediately|blocking)/i.test(text)) return "urgent";
  if (sentiment === "negative") return "high";
  return "normal";
}

// ─── Intent classifier ─────────────────────────────────────────────────

type Intent =
  | "pricing" | "book" | "support" | "refund" | "sales"
  | "unsupported" | "handover" | "greeting" | "smalltalk" | "unknown";

function classify(text: string): Intent {
  const t = text.toLowerCase();
  if (/^(hi|hello|hey|habari|jambo|bonjour|salam)\b/.test(t)) return "greeting";
  if (/(human|agent|person|talk to someone|escalate|manager)/.test(t)) return "handover";
  if (/(price|pricing|cost|plan|how much|quote)/.test(t)) return "pricing";
  if (/(book|appointment|schedule|demo|meeting|viewing|consultation)/.test(t)) return "book";
  if (/(refund|charge back|money back)/.test(t)) return "refund";
  if (/(broken|not working|issue|problem|error|help|support)/.test(t)) return "support";
  if (/(buy|purchase|interested|want to|need|looking for)/.test(t)) return "sales";
  if (/(weather|joke|game|movie|song)/.test(t)) return "unsupported";
  return "unknown";
}

// ─── Business-rule engine ──────────────────────────────────────────────

function applyBusinessRules(cfg: AgentConfig, intent: Intent, text: string):
  | { block: true; reason: string; ruleApplied: string }
  | { block: false } {
  const rules = (cfg.businessRules || "").split(/\n+/);
  if (intent === "refund") {
    const rule = rules.find((r) => /refund/i.test(r));
    if (rule) return { block: true, reason: "Refund policy requires human approval.", ruleApplied: rule.trim() };
  }
  if (/competitor/i.test(text) && /competitor/i.test(cfg.dontSay)) {
    return { block: true, reason: "Blocked by dontSay list (competitors).", ruleApplied: "dontSay: competitors" };
  }
  return { block: false };
}

// ─── Working-hours check ───────────────────────────────────────────────

function isWithinHours(cfg: AgentConfig, at: Date = new Date()): boolean {
  const dayKey = (["sun","mon","tue","wed","thu","fri","sat"] as const)[at.getDay()];
  const d = cfg.workingHours.days[dayKey];
  if (!d?.enabled) return false;
  const [oh, om] = d.open.split(":").map(Number);
  const [ch, cm] = d.close.split(":").map(Number);
  const mins = at.getHours() * 60 + at.getMinutes();
  return mins >= oh * 60 + om && mins <= ch * 60 + cm;
}

// ─── Command matcher ───────────────────────────────────────────────────

function matchCommand(cfg: AgentConfig, text: string) {
  const t = text.trim().toLowerCase();
  return cfg.commands.find((c) => c.enabled && (t.startsWith(c.trigger.toLowerCase()) || t.includes(c.trigger.toLowerCase())));
}

// ─── Reply generator per language ──────────────────────────────────────

const GREETINGS: Record<string, (name: string) => string> = {
  English:    (n) => `Hi, I'm ${n} — how can I help today?`,
  Swahili:    (n) => `Habari! Mimi ni ${n}. Nikusaidieje leo?`,
  French:     (n) => `Bonjour, je suis ${n}. Comment puis-je vous aider ?`,
  Arabic:     (n) => `مرحبا، أنا ${n}. كيف يمكنني مساعدتك؟`,
  Portuguese: (n) => `Olá, eu sou ${n}. Como posso ajudar?`,
  Amharic:    (n) => `ሰላም! እኔ ${n} ነኝ። እንዴት ልረዳዎ?`,
};

function localize(text: string, lang: string): string {
  // Minimal localization suffix so multilingual tests visibly change tone.
  if (lang === "English") return text;
  const tags: Record<string, string> = {
    Swahili: " (Swahili)",
    French: " (Français)",
    Arabic: " (العربية)",
    Portuguese: " (Português)",
    Amharic: " (አማርኛ)",
  };
  return text + (tags[lang] ?? "");
}

// ─── The decision pipeline ─────────────────────────────────────────────

export interface RouteInput {
  agentId: string;
  channel: Channel;
  text: string;
  history?: Message[];
  contactName?: string;
}

export function route(input: RouteInput): ConversationDecision {
  const t0 = performance.now();
  const cfg = db.agentConfigs.get(input.agentId);
  const language = detectLanguage(input.text, cfg.language || "English");
  const sentiment = detectSentiment(input.text);
  const intent = classify(input.text);

  // Rule gate
  const rule = applyBusinessRules(cfg, intent, input.text);
  if (rule.block) {
    return finish({
      decision: "handover",
      reply: cfg.fallbackAnswer || "Let me connect you to a teammate who can help.",
      handover: { route: "support_queue", reason: rule.reason },
      ruleApplied: rule.ruleApplied,
    });
  }

  // Explicit handover request
  if (intent === "handover") {
    return finish({
      decision: "handover",
      reply: "Of course — connecting you to a human teammate now.",
      handover: { route: "support_queue", reason: "Explicit request" },
    });
  }

  // Command match
  const cmd = matchCommand(cfg, input.text);
  if (cmd) {
    return finish({
      decision: "command",
      reply: localize(cmd.response, language),
      command: cmd.trigger,
    });
  }

  // After-hours behaviour
  if (!isWithinHours(cfg)) {
    if (cfg.workingHours.afterHoursBehavior === "handover") {
      return finish({
        decision: "handover",
        reply: "We're outside working hours — connecting you to our on-call teammate.",
        handover: { route: "owner", reason: "After hours" },
      });
    }
    if (cfg.workingHours.afterHoursBehavior === "take_message") {
      return finish({
        decision: "follow_up",
        reply: localize("We're outside working hours. Leave your message and we'll get back within business hours.", language),
      });
    }
  }

  // Knowledge lookup
  const testResult = db.knowledge.testQuestion(input.text);
  const knowledgeHits = testResult.sources.map((s) => ({ id: s.sourceId, name: s.sourceName, score: s.score }));
  const confidenceRaw = testResult.confidence;

  // Low-confidence handover
  if (confidenceRaw < cfg.confidenceThreshold && intent !== "greeting" && intent !== "smalltalk") {
    if (cfg.handoverRules.find((h) => h.enabled && /low confidence/i.test(h.trigger))) {
      return finish({
        decision: "handover",
        reply: cfg.fallbackAnswer,
        handover: { route: "sales_queue", reason: "Low confidence" },
        confidence: confidenceRaw,
        sources: knowledgeHits,
      });
    }
  }

  // Intent-driven actions
  if (intent === "greeting") {
    return finish({
      decision: "answer",
      reply: (GREETINGS[language] ?? GREETINGS.English)(cfg.name),
      confidence: 0.98,
    });
  }
  if (intent === "book" && cfg.allowedActions.book_appointment) {
    return finish({
      decision: "book_appointment",
      reply: localize("Happy to book that. What day and time works best?", language),
      action: "book_appointment",
      confidence: 0.9,
    });
  }
  if (intent === "sales" && cfg.allowedActions.create_lead) {
    return finish({
      decision: "create_lead",
      reply: localize("Great — a teammate will follow up. What's the best number or email to reach you?", language),
      action: "create_lead",
      confidence: 0.88,
    });
  }
  if (intent === "unsupported") {
    return finish({
      decision: "refuse",
      reply: localize("I'm focused on helping with our products and services — is there something I can help you with there?", language),
      confidence: 0.7,
    });
  }

  // Default: answer from knowledge
  return finish({
    decision: "answer",
    reply: localize(testResult.answer, language),
    confidence: confidenceRaw,
    sources: knowledgeHits,
  });

  function finish(p: Partial<ConversationDecision>): ConversationDecision {
    const latencyMs = Math.round(performance.now() - t0 + 120 + Math.random() * 220);
    const reply = p.reply ?? cfg.fallbackAnswer;
    return {
      decision: (p.decision ?? "answer") as AgentDecision,
      reply,
      language,
      confidence: p.confidence ?? 0.75,
      sources: p.sources ?? [],
      command: p.command,
      action: p.action,
      ruleApplied: p.ruleApplied,
      handover: p.handover,
      latencyMs,
      tokensEstimate: Math.ceil((reply.length + input.text.length) / 4),
      sentiment,
    };
  }
}

// ─── Conversation store ────────────────────────────────────────────────

// Reuse the mock CONVERSATIONS array by mutating via db.conversations.list().
function all(): Conversation[] { return db.conversations.list() as Conversation[]; }
function find(id: string) { return all().find((c) => c.id === id); }

function makeMessage(role: Message["role"], text: string, meta?: MessageMeta): Message {
  return { id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role, text, at: new Date().toISOString(), meta };
}

function appendMessage(c: Conversation, m: Message) {
  c.messages.push(m);
  c.lastMessage = m.role === "system" ? c.lastMessage : m.text;
  c.updatedAt = m.at;
}

/** Send a customer message and produce the AI reply + side-effects. */
export function sendCustomerMessage(conversationId: string, text: string): {
  conversation: Conversation; decision: ConversationDecision;
} {
  const c = find(conversationId);
  if (!c) throw new Error("Conversation not found");

  const decision = route({ agentId: c.agentId, channel: c.channel, text, history: c.messages, contactName: c.contactName });

  // Customer message
  appendMessage(c, makeMessage("customer", text, {
    language: decision.language, sentiment: decision.sentiment,
  }));
  c.language = decision.language;
  c.sentiment = decision.sentiment;
  c.priority = detectPriority(text, decision.sentiment);

  // If a human is in control, don't auto-reply.
  if (c.status === "human") return { conversation: c, decision };

  // System messages for commands / actions
  if (decision.command) {
    appendMessage(c, makeMessage("system", `Command triggered: ${decision.command}`, { systemKind: "command", command: decision.command }));
  }
  if (decision.action) {
    appendMessage(c, makeMessage("system", `Action performed: ${decision.action}`, { systemKind: "action", action: decision.action }));
    if (decision.action === "create_lead") c.outcome = "lead_created";
    if (decision.action === "book_appointment") c.outcome = "appointment_booked";
  }
  if (decision.ruleApplied) {
    appendMessage(c, makeMessage("system", `Business rule applied: ${decision.ruleApplied}`, { systemKind: "info", ruleApplied: decision.ruleApplied }));
  }

  // Handover?
  if (decision.handover) {
    appendMessage(c, makeMessage("agent", decision.reply, { language: decision.language, confidence: decision.confidence, decision: "handover", latencyMs: decision.latencyMs }));
    appendMessage(c, makeMessage("system", `Handover → ${decision.handover.route} · ${decision.handover.reason}`, { systemKind: "handover" }));
    c.status = "escalated";
    c.outcome = "handover";
  } else {
    appendMessage(c, makeMessage("agent", decision.reply, {
      language: decision.language,
      confidence: decision.confidence,
      sources: decision.sources,
      decision: decision.decision,
      command: decision.command,
      action: decision.action,
      latencyMs: decision.latencyMs,
      tokensEstimate: decision.tokensEstimate,
      sentiment: decision.sentiment,
    }));
    if (c.status === "new" || c.status === "waiting") c.status = "active";
  }

  c.unread = 0;
  return { conversation: c, decision };
}

/** Human takes over the conversation. */
export function takeover(conversationId: string, memberName = "You"): Conversation {
  const c = find(conversationId)!;
  c.status = "human";
  c.takeoverBy = memberName;
  c.takeoverAt = new Date().toISOString();
  c.assignedTo = memberName;
  appendMessage(c, makeMessage("system", `${memberName} took over — AI paused`, { systemKind: "handover" }));
  return c;
}

/** Human sends a reply. */
export function sendHumanMessage(conversationId: string, text: string, memberName = "You"): Conversation {
  const c = find(conversationId)!;
  appendMessage(c, makeMessage("human", text, { language: c.language }));
  c.assignedTo = memberName;
  return c;
}

/** Return control back to the AI, with a short summary. */
export function returnToAI(conversationId: string, memberName = "You"): Conversation {
  const c = find(conversationId)!;
  const summary = summarizeConversation(c);
  c.status = "active";
  c.returnedBy = memberName;
  c.returnedAt = new Date().toISOString();
  c.handoverSummary = summary;
  appendMessage(c, makeMessage("system", `Returned to AI by ${memberName}. Summary: ${summary}`, { systemKind: "return" }));
  return c;
}

function summarizeConversation(c: Conversation): string {
  const last = c.messages.filter((m) => m.role !== "system").slice(-4);
  const bits = last.map((m) => `${m.role === "customer" ? "C" : m.role === "human" ? "H" : "A"}: ${m.text.slice(0, 60)}`);
  return bits.join(" · ");
}

/** Mutate status + record outcome. */
export function setStatus(conversationId: string, status: ConversationStatus, opts?: { outcome?: ConversationOutcome; note?: string }): Conversation {
  const c = find(conversationId)!;
  c.status = status;
  if (opts?.outcome) c.outcome = opts.outcome;
  if (status === "spam") c.spam = true;
  if (status === "archived") c.archived = true;
  if (opts?.note) appendMessage(c, makeMessage("system", opts.note, { systemKind: "info" }));
  return c;
}

export function assignTo(conversationId: string, member: string) {
  const c = find(conversationId)!;
  c.assignedTo = member;
  appendMessage(c, makeMessage("system", `Assigned to ${member}`, { systemKind: "info" }));
  return c;
}

export function addNote(conversationId: string, text: string, author = "You"): ConversationNote {
  const c = find(conversationId)!;
  const note: ConversationNote = { id: `n-${Date.now()}`, author, text, at: new Date().toISOString() };
  c.notes = [...(c.notes ?? []), note];
  return note;
}

export function createLeadFromConversation(conversationId: string) {
  const c = find(conversationId)!;
  c.outcome = "lead_created";
  appendMessage(c, makeMessage("system", `Lead created for ${c.contactName}`, { systemKind: "action", action: "create_lead" }));
  return c;
}

export function bookAppointmentFromConversation(conversationId: string) {
  const c = find(conversationId)!;
  c.outcome = "appointment_booked";
  appendMessage(c, makeMessage("system", `Appointment booked for ${c.contactName}`, { systemKind: "action", action: "book_appointment" }));
  return c;
}

export function createTicketFromConversation(conversationId: string) {
  const c = find(conversationId)!;
  c.outcome = "ticket_created";
  appendMessage(c, makeMessage("system", `Support ticket created`, { systemKind: "action" }));
  return c;
}

export function resolve(conversationId: string) {
  return setStatus(conversationId, "resolved", { outcome: "resolved", note: "Marked resolved" });
}

// ─── Testing scenarios ─────────────────────────────────────────────────

export const TEST_SCENARIOS: TestScenario[] = [
  { id: "sales", label: "Sales enquiry", category: "sales",
    messages: ["Hi, I'm looking for a plan for a 10-person team.", "What's included?"] },
  { id: "support", label: "Customer support question", category: "support",
    messages: ["My dashboard isn't loading since this morning.", "Can you help?"] },
  { id: "appointment", label: "Appointment request", category: "appointment",
    messages: ["I'd like to book a demo for Friday.", "Afternoon works better."] },
  { id: "complaint", label: "Complaint", category: "complaint",
    messages: ["This is terrible — nothing works. I'm really frustrated."] },
  { id: "pricing", label: "Pricing request", category: "pricing",
    messages: ["How much is the Growth plan?"] },
  { id: "unsupported", label: "Unsupported question", category: "unsupported",
    messages: ["What's the weather like tomorrow?"] },
  { id: "handover", label: "Human handover request", category: "handover",
    messages: ["I want to talk to a human please."] },
  { id: "multi-sw", label: "Swahili conversation", category: "multilingual",
    messages: ["Habari, naomba bei ya mpango wa Growth."] },
  { id: "multi-fr", label: "French conversation", category: "multilingual",
    messages: ["Bonjour, quel est le prix du plan Growth ?"] },
  { id: "lang-switch", label: "Customer switches language", category: "language_switch",
    messages: ["Hi, is delivery available?", "Habari, unatuma Kisumu?"] },
];

/** Run a scenario against an agent and return the detailed traces. */
export function runScenario(agentId: string, scenario: TestScenario) {
  const traces = scenario.messages.map((msg) => {
    const decision = route({ agentId, channel: "web", text: msg });
    return { input: msg, decision };
  });
  return { scenario, traces };
}

// ─── Public API ────────────────────────────────────────────────────────

export const conversationDb = {
  route,
  detectLanguage,
  send: sendCustomerMessage,
  takeover,
  returnToAI,
  sendHuman: sendHumanMessage,
  setStatus,
  assignTo,
  addNote,
  createLead: createLeadFromConversation,
  bookAppointment: bookAppointmentFromConversation,
  createTicket: createTicketFromConversation,
  resolve,
  scenarios: TEST_SCENARIOS,
  runScenario,
};

export type ConversationDb = typeof conversationDb;