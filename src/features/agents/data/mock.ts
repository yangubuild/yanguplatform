import type {
  Agent, Conversation, Lead, Appointment, Call, KnowledgeItem,
  Workflow, Integration, TeamMember,
} from "./types";

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

export const db = {
  agents:       { list: () => AGENTS, get: (id: string) => AGENTS.find(a => a.id === id) },
  conversations:{ list: () => CONVERSATIONS, get: (id: string) => CONVERSATIONS.find(c => c.id === id) },
  leads:        { list: () => LEADS },
  appointments: { list: () => APPOINTMENTS },
  calls:        { list: () => CALLS },
  knowledge:    { list: () => KNOWLEDGE },
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