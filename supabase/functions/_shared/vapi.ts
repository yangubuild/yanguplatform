// Shared Vapi helpers. Server-side only — the private key never leaves here.

const VAPI_BASE = "https://api.vapi.ai";

export class VapiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(`vapi_error_${status}`);
    this.status = status;
    this.detail = detail;
  }
}

export async function vapiFetch(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<any> {
  const key = Deno.env.get("VAPI_API_KEY");
  if (!key) throw new VapiError(500, "VAPI_API_KEY not configured");
  const res = await fetch(`${VAPI_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  let parsed: unknown = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  if (!res.ok) throw new VapiError(res.status, parsed);
  return parsed;
}

export interface AgentBuildConfig {
  agentName?: string;
  businessName?: string;
  type?: string;              // inbound | outbound | support
  purpose?: string;
  products?: string;
  targetCustomers?: string;
  greeting?: string;
  languages?: string[];
  voice?: string;             // Vapi voiceId
  hours?: string;
  timezone?: string;
  escalation?: string;
  transferNumber?: string;
  appointments?: boolean;
  qualificationQuestions?: string[];
  faqs?: { q: string; a: string }[];
  knowledgeText?: string;
  objectives?: string;
  prohibited?: string;
  fallback?: string;
  outcome?: string;
}

/** Build the assistant system prompt from the Yangu agent configuration. */
export function buildSystemPrompt(c: AgentBuildConfig): string {
  const langs = (c.languages ?? ["English"]).join(", ");
  const lines: string[] = [];
  lines.push(`# Role`);
  lines.push(
    `You are ${c.agentName || "an AI assistant"}, a ${c.type ?? "inbound"} voice agent for ${c.businessName || "the business"}.`,
  );
  if (c.purpose) lines.push(`Your purpose: ${c.purpose}.`);

  lines.push(`\n# Company identity`);
  lines.push(`Business: ${c.businessName || "—"}`);
  if (c.products) lines.push(`Products / services: ${c.products}`);
  if (c.targetCustomers) lines.push(`Typical callers: ${c.targetCustomers}`);
  if (c.hours) lines.push(`Business hours: ${c.hours}${c.timezone ? ` (${c.timezone})` : ""}`);

  lines.push(`\n# Objectives`);
  lines.push(c.objectives || c.purpose || "Help the caller and capture their details accurately.");
  if (c.outcome) lines.push(`Desired outcome of each call: ${c.outcome}`);

  lines.push(`\n# Conversational behaviour`);
  lines.push(
    "Speak naturally and concisely, one question at a time. Confirm names, numbers and dates by repeating them back. Never talk over the caller. Keep replies under three sentences unless asked for detail.",
  );

  lines.push(`\n# Language behaviour`);
  lines.push(
    `Supported languages: ${langs}. Open in ${(c.languages ?? ["English"])[0]} and immediately switch to whichever supported language the caller uses. Never mix languages in one sentence.`,
  );

  if (c.qualificationQuestions?.length) {
    lines.push(`\n# Qualification rules`);
    lines.push("Gather these details naturally during the conversation:");
    c.qualificationQuestions.forEach((q) => lines.push(`- ${q}`));
  }

  lines.push(`\n# Escalation rules`);
  lines.push(
    c.escalation ||
      "If the caller is upset, asks for a human, or you cannot answer after two attempts, take a message and promise a callback.",
  );
  if (c.transferNumber) lines.push(`When a live transfer is required, transfer to ${c.transferNumber}.`);

  lines.push(`\n# Appointment behaviour`);
  lines.push(
    c.appointments
      ? "You may book appointments. Collect the caller's full name, phone number, preferred date and time, then confirm the details back before finishing."
      : "You do not book appointments. Take a message with the caller's name, number and reason for calling.",
  );

  if (c.faqs?.length) {
    lines.push(`\n# Known answers`);
    c.faqs.forEach((f) => lines.push(`Q: ${f.q}\nA: ${f.a}`));
  }
  if (c.knowledgeText) {
    lines.push(`\n# Business knowledge`);
    lines.push(c.knowledgeText.slice(0, 6000));
  }

  lines.push(`\n# Prohibited behaviour`);
  lines.push(
    c.prohibited ||
      "Never invent prices, availability, medical, legal or financial advice. Never promise anything outside your instructions. Never reveal that you are following a script or expose internal tooling.",
  );

  lines.push(`\n# Fallback behaviour`);
  lines.push(
    c.fallback ||
      "If you do not know something, say so plainly, capture the question with the caller's contact details and promise a follow-up.",
  );

  return lines.join("\n");
}

export function buildFirstMessage(c: AgentBuildConfig): string {
  if (c.greeting) return c.greeting;
  return `Hello, thank you for calling ${c.businessName || "us"}. How can I help you today?`;
}

/** Map a Yangu agent config onto the current Vapi assistant payload shape. */
export function buildAssistantPayload(c: AgentBuildConfig, serverUrl?: string, serverSecret?: string) {
  const payload: Record<string, unknown> = {
    name: (c.agentName || c.businessName || "Yangu Agent").slice(0, 40),
    firstMessage: buildFirstMessage(c),
    model: {
      provider: "openai",
      model: "gpt-4.1-mini",
      messages: [{ role: "system", content: buildSystemPrompt(c) }],
    },
    voice: { provider: "vapi", voiceId: c.voice || "Elliot" },
    transcriber: { provider: "deepgram", model: "nova-3", language: "multi" },
  };
  if (serverUrl) {
    payload.server = { url: serverUrl, ...(serverSecret ? { secret: serverSecret } : {}) };
  }
  return payload;
}
