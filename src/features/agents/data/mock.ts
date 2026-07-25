import type {
  Agent, Conversation, Lead, Appointment, Call, KnowledgeItem,
  Workflow, Integration, TeamMember, AgentConfig, Channel,
} from "./types";
import { knowledgeDb } from "./knowledgeDb";

const now = new Date();
const iso = (d: number, h = 0, m = 0) => new Date(now.getTime() - d * 86400000 + h * 3600000 + m * 60000).toISOString();

const AGENTS: Agent[] = [
  { id: "a-amara", name: "Amara", type: "sales", status: "live",
    channels: ["whatsapp", "web", "voice"], language: "English + Swahili",
    voice: "Warm Female — Nairobi", conversationsToday: 87, leadsThisWeek: 42,
    handoverRate: 4.2, updatedAt: iso(0, -2), description: "Qualifies leads and books demos across WhatsApp, web and voice." },
  { id: "a-kito", name: "Kito", type: "receptionist", status: "live",
    channels: ["voice", "whatsapp"], language: "English",
    voice: "Professional Male — EA", conversationsToday: 54, leadsThisWeek: 18,
    handoverRate: 5.1, updatedAt: iso(0, -5), description: "Answers calls, books appointments and takes messages." },
  { id: "a-zara", name: "Zara", type: "support", status: "paused",
    channels: ["web", "email", "whatsapp"], language: "English + French",
    voice: "Neutral Female — Global", conversationsToday: 22, leadsThisWeek: 8,
    handoverRate: 8.9, updatedAt: iso(1), description: "Resolves support tickets and escalates when unsure." },
  { id: "a-kaya", name: "Kaya", type: "knowledge", status: "draft",
    channels: ["web"], language: "English",
    voice: "—", conversationsToday: 12, leadsThisWeek: 3,
    handoverRate: 2.1, updatedAt: iso(2), description: "Answers questions from your knowledge base." },
];

const CONVERSATIONS: Conversation[] = [
  { id: "c-1", contactName: "Ruth Muriuki", contactHandle: "+254 712 445 990",
    channel: "whatsapp", agentId: "a-amara", lastMessage: "Perfect — see you Saturday at 10am!",
    unread: 0, updatedAt: iso(0, -1), status: "open",
    messages: [
      { id: "m1", role: "customer", text: "Hi, do you have a 3-bed available in Kileleshwa?", at: iso(0, -3) },
      { id: "m2", role: "agent", text: "Yes! We have 2 units available. Would you like to book a viewing?", at: iso(0, -3, 1) },
      { id: "m3", role: "customer", text: "Yes please, Saturday morning works.", at: iso(0, -2, 30) },
      { id: "m4", role: "agent", text: "Perfect — see you Saturday at 10am!", at: iso(0, -1) },
    ]},
  { id: "c-2", contactName: "David Chen", contactHandle: "david@acme.co",
    channel: "email", agentId: "a-zara", lastMessage: "This is blocking our team, please escalate.",
    unread: 2, updatedAt: iso(0, -4), status: "handover",
    messages: [
      { id: "m1", role: "customer", text: "Our dashboard is not loading since morning.", at: iso(0, -6) },
      { id: "m2", role: "agent", text: "Sorry to hear that. Can you share your workspace ID?", at: iso(0, -6, 2) },
      { id: "m3", role: "customer", text: "acme-42. This is blocking our team, please escalate.", at: iso(0, -4) },
      { id: "m4", role: "system", text: "Handover requested — connecting a human", at: iso(0, -4, 1) },
    ]},
  { id: "c-3", contactName: "Aisha Ndegwa", contactHandle: "+254 733 220 118",
    channel: "whatsapp", agentId: "a-amara", lastMessage: "Can you share the price list?",
    unread: 1, updatedAt: iso(0, -6), status: "open",
    messages: [
      { id: "m1", role: "customer", text: "Can you share the price list?", at: iso(0, -6) },
    ]},
  { id: "c-4", contactName: "Peter Odhiambo", contactHandle: "peter.o",
    channel: "web", agentId: "a-kaya", lastMessage: "Thanks, that answered it.",
    unread: 0, updatedAt: iso(1), status: "closed",
    messages: [
      { id: "m1", role: "customer", text: "Do you deliver to Kisumu?", at: iso(1) },
      { id: "m2", role: "agent", text: "Yes — 2 to 3 days, KES 450 flat.", at: iso(1, 0, 1) },
      { id: "m3", role: "customer", text: "Thanks, that answered it.", at: iso(1, 0, 3) },
    ]},
  { id: "c-5", contactName: "Grace Wanjiru", contactHandle: "+254 705 998 771",
    channel: "voice", agentId: "a-kito", lastMessage: "Call ended — appointment booked.",
    unread: 0, updatedAt: iso(2), status: "closed",
    messages: [
      { id: "m1", role: "system", text: "Inbound voice call · 3m 12s", at: iso(2) },
      { id: "m2", role: "agent", text: "Booked consultation Friday 3pm.", at: iso(2, 0, 3) },
    ]},
];

const LEADS: Lead[] = [
  { id: "l-1", name: "Aisha Ndegwa", phone: "+254 733 220 118", source: "whatsapp",
    intent: "Pricing inquiry", score: 62, stage: "new", owner: "Amara", createdAt: iso(0) },
  { id: "l-2", name: "Ruth Muriuki", phone: "+254 712 445 990", source: "whatsapp",
    intent: "3-bed apartment", score: 78, stage: "qualified", owner: "Amara", createdAt: iso(1) },
  { id: "l-3", name: "Grace Wanjiru", phone: "+254 705 998 771", source: "voice",
    intent: "Consultation", score: 71, stage: "booked", owner: "Kito", createdAt: iso(2) },
  { id: "l-4", name: "Miriam Osei", email: "miriam@osei.co", source: "web",
    intent: "Enterprise plan", score: 92, stage: "won", owner: "Amara", createdAt: iso(6) },
  { id: "l-5", name: "Kevin Mwangi", email: "kev@mail.com", source: "email",
    intent: "Refund", score: 22, stage: "lost", owner: "Zara", createdAt: iso(9) },
];

const APPOINTMENTS: Appointment[] = [
  { id: "ap-1", title: "Property viewing — 3 bed Kileleshwa", contact: "Ruth Muriuki",
    channel: "whatsapp", when: iso(-1, 10), duration: 45, agentId: "a-amara", status: "scheduled" },
  { id: "ap-2", title: "Product demo", contact: "Miriam Osei",
    channel: "web", when: iso(-2, 14), duration: 30, agentId: "a-amara", status: "scheduled" },
  { id: "ap-3", title: "Consultation", contact: "Grace Wanjiru",
    channel: "voice", when: iso(-3, 15), duration: 30, agentId: "a-kito", status: "scheduled" },
];

const CALLS: Call[] = [
  { id: "call-1", contact: "Grace Wanjiru", direction: "inbound", agentId: "a-kito",
    duration: 192, outcome: "booked", when: iso(0, -2),
    transcript: "Kito: Hi, this is Kito from Yangu. How can I help?\nGrace: I'd like to book a consultation.\nKito: Absolutely, Friday 3pm works — you're booked." },
  { id: "call-2", contact: "James Otieno", direction: "inbound", agentId: "a-kito",
    duration: 24, outcome: "voicemail", when: iso(0, -6) },
  { id: "call-3", contact: "Nina Karanja", direction: "outbound", agentId: "a-amara",
    duration: 421, outcome: "qualified", when: iso(1, -3) },
];

const KNOWLEDGE: KnowledgeItem[] = [
  { id: "k-1", title: "Product catalogue 2026", type: "doc", size: "1.4 MB",
    updatedAt: iso(3), agents: ["a-amara", "a-kaya"], status: "indexed" },
  { id: "k-2", title: "Company FAQ", type: "faq", size: "42 entries",
    updatedAt: iso(5), agents: ["a-zara", "a-kaya"], status: "indexed" },
  { id: "k-3", title: "yangu.io/pricing", type: "url", size: "1 page",
    updatedAt: iso(1), agents: ["a-amara"], status: "indexed" },
  { id: "k-4", title: "Staff handbook v3.pdf", type: "file", size: "3.2 MB",
    updatedAt: iso(0), agents: [], status: "processing" },
];

const WORKFLOWS: Workflow[] = [
  { id: "w-1", name: "New lead → CRM + WhatsApp", trigger: "New lead created",
    steps: 4, runs: 328, status: "active", updatedAt: iso(2) },
  { id: "w-2", name: "Missed call → SMS follow-up", trigger: "Voicemail received",
    steps: 2, runs: 91, status: "active", updatedAt: iso(4) },
  { id: "w-3", name: "Booking confirmation email", trigger: "Appointment booked",
    steps: 3, runs: 210, status: "active", updatedAt: iso(1) },
  { id: "w-4", name: "Escalate refund requests", trigger: "Intent: refund",
    steps: 5, runs: 12, status: "draft", updatedAt: iso(7) },
];

const INTEGRATIONS: Integration[] = [
  { id: "i-wa", name: "WhatsApp Business", category: "channels", connected: true, icon: "MessageCircle", description: "Send and receive on WhatsApp Cloud API." },
  { id: "i-web", name: "Website Chat", category: "channels", connected: true, icon: "Globe", description: "Embeddable widget for your site." },
  { id: "i-voice", name: "Voice / Telephony", category: "channels", connected: true, icon: "Phone", description: "Inbound and outbound calling." },
  { id: "i-ig", name: "Instagram DMs", category: "channels", connected: false, icon: "Instagram", description: "Reply to Instagram direct messages." },
  { id: "i-gcal", name: "Google Calendar", category: "calendar", connected: true, icon: "Calendar", description: "Sync appointments with Google Calendar." },
  { id: "i-m365", name: "Microsoft 365", category: "calendar", connected: false, icon: "Calendar", description: "Sync with Outlook / Teams calendars." },
  { id: "i-hubspot", name: "HubSpot", category: "crm", connected: false, icon: "Users", description: "Sync leads and contacts with HubSpot." },
  { id: "i-sf", name: "Salesforce", category: "crm", connected: false, icon: "Users", description: "Bi-directional CRM sync." },
  { id: "i-stripe", name: "Stripe", category: "payments", connected: true, icon: "CreditCard", description: "Charge cards and take deposits in chat." },
  { id: "i-zap", name: "Zapier", category: "automation", connected: true, icon: "Zap", description: "Connect 6,000+ apps via Zaps." },
  { id: "i-make", name: "Make", category: "automation", connected: false, icon: "Zap", description: "Visual automation builder." },
  { id: "i-drive", name: "Google Drive", category: "storage", connected: false, icon: "FolderOpen", description: "Import documents into knowledge base." },
];

const TEAM: TeamMember[] = [
  { id: "t-1", name: "You", email: "owner@yangu.io", role: "owner", status: "active", avatar: "Y", lastActive: iso(0) },
  { id: "t-2", name: "James Njoroge", email: "james@yangu.io", role: "admin", status: "active", avatar: "JN", lastActive: iso(0, -1) },
  { id: "t-3", name: "Faith Wangari", email: "faith@yangu.io", role: "manager", status: "active", avatar: "FW", lastActive: iso(1) },
  { id: "t-4", name: "Samuel Kariuki", email: "samuel@yangu.io", role: "agent", status: "invited", avatar: "SK", lastActive: iso(3) },
];

// ─── Agent configuration store ─────────────────────────────────────────

function defaultConfigFor(a: Agent): AgentConfig {
  const channelKeys: Channel[] = ["whatsapp","web","voice","instagram","email","sms"];
  const channels = Object.fromEntries(
    channelKeys.map((c) => [c, { enabled: a.channels.includes(c) }])
  ) as AgentConfig["channels"];

  return {
    id: `cfg-${a.id}`,
    agentId: a.id,
    name: a.name,
    avatarUrl: undefined,
    role: `${a.type[0].toUpperCase()}${a.type.slice(1)} Agent`,
    department:
      a.type === "sales" ? "sales" :
      a.type === "support" ? "customer_support" :
      a.type === "receptionist" ? "reception" : "operations",

    personaDescription: a.description,
    toneStyle: "warm",
    formalCasual: 50, conciseDetailed: 40, warmDirect: 40,
    doSay: "Always confirm the customer's name.\nOffer next best action after answering.",
    dontSay: "Never make refund promises without approval.\nDo not discuss competitors.",
    sampleGreetings: `Hi, I'm ${a.name} — how can I help today?\nWelcome! I'm ${a.name}, your assistant.`,

    voiceEnabled: a.voice !== "—",
    voiceProvider: "elevenlabs",
    voiceId: a.voice,
    gender: a.name === "Kito" ? "male" : "female",
    language: a.language.split(" ")[0] ?? "English",
    secondaryLanguages: a.language.includes("+") ? [a.language.split("+")[1].trim()] : [],
    regionalAccent: "East African",
    speakingSpeed: 100,
    pitch: 50,
    fillerWords: false,
    phoneNumber: "",

    greeting: `Hi, I'm ${a.name} from Yangu. How can I help?`,
    businessGoals: "Qualify inbound leads, book demos, and reduce first-response time.",
    companyInstructions:
      "You represent Yangu. Always be helpful, culturally aware, and never invent product features.",
    companyKnowledge: "Yangu is an AI-powered business platform for Africa and the Middle East.",
    businessRules:
      "1. Never quote prices outside the published price list.\n2. Escalate refunds > $100 to a human.\n3. Collect consent before recording calls.",
    commands: [
      { id: "cmd-1", trigger: "/pricing", response: "Share the current pricing page.", enabled: true },
      { id: "cmd-2", trigger: "/book", response: "Start the appointment booking flow.", enabled: true },
    ],
    qualificationQuestions: [
      { id: "q-1", question: "What's your name?", required: true, type: "text" },
      { id: "q-2", question: "What's the best number to reach you on?", required: true, type: "phone" },
      { id: "q-3", question: "What are you looking for?", required: false, type: "text" },
    ],

    attachedKnowledgeIds: KNOWLEDGE.filter(k => k.agents.includes(a.id)).map(k => k.id),
    topK: 5,
    similarityThreshold: 0.7,
    fallbackAnswer: "Great question — let me connect you with a teammate who can help.",

    allowedActions: {
      book_appointment: true, send_email: true, send_sms: true, create_lead: true,
      update_crm: true, take_payment: false, transfer_call: true, escalate_human: true,
      send_invoice: false, refund: false, tag_contact: true, schedule_followup: true,
    },

    channels,
    webWidgetTheme: "auto",

    attachedWorkflowIds: WORKFLOWS.filter(w => w.status === "active").slice(0,2).map(w => w.id),

    handoverRules: [
      { id: "h-1", trigger: "Frustration detected", enabled: true,  route: "support_queue" },
      { id: "h-2", trigger: "Explicit request",     enabled: true,  route: "support_queue" },
      { id: "h-3", trigger: "Low confidence",       enabled: true,  route: "sales_queue"   },
      { id: "h-4", trigger: "Off-topic",            enabled: false, route: "owner"         },
      { id: "h-5", trigger: "Payment / refund",     enabled: true,  route: "owner"         },
    ],
    confidenceThreshold: 0.6,
    notifyChannel: "Slack #support",
    businessHoursRoute: "Human queue: Support",
    afterHoursRoute: "Callback within 2 hours",

    connectedIntegrationIds: INTEGRATIONS.filter(i => i.connected).map(i => i.id),

    workingHours: {
      timezone: "Africa/Nairobi",
      days: {
        mon: { enabled: true, open: "08:00", close: "18:00" },
        tue: { enabled: true, open: "08:00", close: "18:00" },
        wed: { enabled: true, open: "08:00", close: "18:00" },
        thu: { enabled: true, open: "08:00", close: "18:00" },
        fri: { enabled: true, open: "08:00", close: "18:00" },
        sat: { enabled: false, open: "09:00", close: "13:00" },
        sun: { enabled: false, open: "09:00", close: "13:00" },
      },
      holidays: [],
      afterHoursBehavior: "take_message",
    },

    memoryEnabled: true,
    memoryScope: "contact",
    memoryRetentionDays: 90,

    piiRedaction: true,
    recordingConsent: true,
    gdprMode: true,
    dataResidency: "africa",
    disclaimer: "This conversation may be handled by an AI assistant.",

    rateLimitPerMin: 60,

    environment: a.status === "live" ? "live" : "draft",
    version: 1,
    webhookUrl: `https://yangu.io/api/agents/${a.id}/webhook`,

    updatedAt: a.updatedAt,
    publishedAt: a.status === "live" ? a.updatedAt : undefined,
  };
}

const AGENT_CONFIGS: Record<string, AgentConfig> = Object.fromEntries(
  AGENTS.map((a) => [a.id, defaultConfigFor(a)])
);

export const db = {
  agents:       { list: () => AGENTS, get: (id: string) => AGENTS.find(a => a.id === id) },
  agentConfigs: {
    get: (agentId: string): AgentConfig => {
      if (!AGENT_CONFIGS[agentId]) {
        const a = AGENTS.find(x => x.id === agentId);
        if (a) AGENT_CONFIGS[agentId] = defaultConfigFor(a);
      }
      return AGENT_CONFIGS[agentId];
    },
    save: (agentId: string, patch: Partial<AgentConfig>): AgentConfig => {
      const prev = db.agentConfigs.get(agentId);
      const next: AgentConfig = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      AGENT_CONFIGS[agentId] = next;
      const agent = AGENTS.find(a => a.id === agentId);
      if (agent) {
        agent.name = next.name;
        agent.description = next.personaDescription;
        agent.language = [next.language, ...next.secondaryLanguages].filter(Boolean).join(" + ");
        agent.voice = next.voiceId || "—";
        agent.channels = (Object.keys(next.channels) as Channel[]).filter(c => next.channels[c].enabled);
        agent.updatedAt = next.updatedAt;
      }
      return next;
    },
    publish: (agentId: string, env: "draft" | "staging" | "live"): AgentConfig => {
      const prev = db.agentConfigs.get(agentId);
      const next: AgentConfig = {
        ...prev,
        environment: env,
        version: env === "live" ? prev.version + 1 : prev.version,
        publishedAt: env === "live" ? new Date().toISOString() : prev.publishedAt,
        updatedAt: new Date().toISOString(),
      };
      AGENT_CONFIGS[agentId] = next;
      const agent = AGENTS.find(a => a.id === agentId);
      if (agent) {
        agent.status = env === "live" ? "live" : env === "staging" ? "paused" : "draft";
        agent.updatedAt = next.updatedAt;
      }
      return next;
    },
  },
  conversations:{ list: () => CONVERSATIONS, get: (id: string) => CONVERSATIONS.find(c => c.id === id) },
  leads:        { list: () => LEADS },
  appointments: { list: () => APPOINTMENTS },
  calls:        { list: () => CALLS },
  knowledge:    { list: () => KNOWLEDGE, ...knowledgeDb },
  workflows:    { list: () => WORKFLOWS },
  integrations: { list: () => INTEGRATIONS },
  team:         { list: () => TEAM },
  kpis:         () => ({
    conversationsToday: 175, leadsThisWeek: 96,
    appointmentsBooked: 42, handoverRate: 6.4,
    conversationsDelta: "+12%", leadsDelta: "+8%",
    appointmentsDelta: "+3", handoverDelta: "-1.2pp",
  }),
};

export type Db = typeof db;