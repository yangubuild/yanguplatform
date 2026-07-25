export type AgentType = "sales" | "receptionist" | "support" | "knowledge";
export type AgentStatus = "live" | "draft" | "paused";
export type Channel = "whatsapp" | "web" | "voice" | "instagram" | "email" | "sms";

export interface Agent {
  id: string; name: string; type: AgentType; status: AgentStatus;
  channels: Channel[]; language: string; voice: string;
  conversationsToday: number; leadsThisWeek: number; handoverRate: number;
  updatedAt: string; description: string;
}

// ─── Production-ready AI Employee configuration ────────────────────────

export type Department =
  | "sales" | "customer_support" | "reception" | "operations"
  | "hr" | "finance" | "marketing" | "it" | "logistics" | "custom";

export type VoiceProvider = "elevenlabs" | "openai" | "google" | "azure" | "polly" | "coqui";
export type Gender = "female" | "male" | "neutral";
export type ToneStyle = "warm" | "professional" | "friendly" | "playful" | "direct" | "empathetic";
export type MemoryScope = "session" | "contact" | "org";
export type PublishEnv = "draft" | "staging" | "live";

export interface WorkingHours {
  timezone: string;
  days: Record<"mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun", { enabled: boolean; open: string; close: string }>;
  holidays: string[];        // ISO dates
  afterHoursBehavior: "handover" | "take_message" | "book_callback" | "auto_reply";
}

export interface QualificationQuestion {
  id: string; question: string; required: boolean;
  type: "text" | "email" | "phone" | "choice" | "budget";
  choices?: string[];
}

export interface AgentCommand {
  id: string; trigger: string; response: string; enabled: boolean;
}

export interface HandoverRule {
  id: string; trigger: string; enabled: boolean;
  route: "support_queue" | "sales_queue" | "owner" | "custom";
  customTarget?: string;
}

export interface AgentConfig {
  id: string;
  agentId: string;

  // Identity
  name: string;
  avatarUrl?: string;
  role: string;
  department: Department;

  // Personality
  personaDescription: string;
  toneStyle: ToneStyle;
  formalCasual: number;   // 0-100
  conciseDetailed: number;
  warmDirect: number;
  doSay: string;
  dontSay: string;
  sampleGreetings: string;

  // Voice
  voiceEnabled: boolean;
  voiceProvider: VoiceProvider;
  voiceId: string;
  gender: Gender;
  language: string;
  secondaryLanguages: string[];
  regionalAccent: string;
  speakingSpeed: number;   // 0.5–2.0 (stored *100)
  pitch: number;           // 0-100
  fillerWords: boolean;
  phoneNumber?: string;

  // Behaviour
  greeting: string;
  businessGoals: string;
  companyInstructions: string;
  companyKnowledge: string;
  businessRules: string;
  commands: AgentCommand[];
  qualificationQuestions: QualificationQuestion[];

  // Knowledge base
  attachedKnowledgeIds: string[];
  topK: number;
  similarityThreshold: number;
  fallbackAnswer: string;

  // Actions
  allowedActions: Record<string, boolean>;

  // Channels
  channels: Record<Channel, { enabled: boolean; config?: Record<string, string> }>;
  webWidgetTheme: "light" | "dark" | "auto";

  // Workflows
  attachedWorkflowIds: string[];

  // Handover
  handoverRules: HandoverRule[];
  confidenceThreshold: number;
  notifyChannel: string;
  businessHoursRoute: string;
  afterHoursRoute: string;

  // Integrations
  connectedIntegrationIds: string[];

  // Working hours
  workingHours: WorkingHours;

  // Memory
  memoryEnabled: boolean;
  memoryScope: MemoryScope;
  memoryRetentionDays: number;

  // Compliance
  piiRedaction: boolean;
  recordingConsent: boolean;
  gdprMode: boolean;
  dataResidency: "eu" | "us" | "africa" | "global";
  disclaimer: string;

  // Settings
  rateLimitPerMin: number;

  // Deploy
  environment: PublishEnv;
  version: number;
  webhookUrl: string;

  // Meta
  updatedAt: string;
  publishedAt?: string;
}

export interface Message {
  id: string; role: "customer" | "agent" | "human" | "system"; text: string; at: string;
  meta?: MessageMeta;
}
export interface Conversation {
  id: string; contactName: string; contactHandle: string; channel: Channel;
  agentId: string; lastMessage: string; unread: number; updatedAt: string;
  status: ConversationStatus; messages: Message[];
  priority?: "low" | "normal" | "high" | "urgent";
  sentiment?: "positive" | "neutral" | "negative";
  language?: string;
  outcome?: ConversationOutcome;
  assignedTo?: string;            // team member id when a human takes over
  takeoverBy?: string;
  takeoverAt?: string;
  returnedBy?: string;
  returnedAt?: string;
  handoverSummary?: string;
  tags?: string[];
  notes?: ConversationNote[];
  memoryRetention?: MemoryRetention;
  spam?: boolean;
  archived?: boolean;
}

// ─── Conversation Engine ───────────────────────────────────────────────

export type ConversationStatus =
  | "new" | "open" | "active" | "waiting" | "escalated"
  | "human" | "handover" | "resolved" | "closed" | "spam" | "archived";

export type ConversationOutcome =
  | "answered" | "lead_created" | "appointment_booked" | "ticket_created"
  | "handover" | "refused" | "resolved" | "abandoned" | "open";

export type MemoryRetention =
  | "session" | "7d" | "30d" | "90d" | "custom" | "none";

export type AgentDecision =
  | "answer" | "follow_up" | "command" | "action"
  | "create_lead" | "book_appointment" | "handover" | "refuse";

export interface MessageMeta {
  language?: string;
  confidence?: number;           // 0–1
  sources?: { id: string; name: string; score: number }[];
  command?: string;              // trigger fired e.g. "/pricing"
  action?: string;               // allowedAction id e.g. "book_appointment"
  decision?: AgentDecision;
  ruleApplied?: string;
  latencyMs?: number;
  tokensEstimate?: number;
  sentiment?: "positive" | "neutral" | "negative";
  systemKind?: "handover" | "return" | "command" | "action" | "note" | "info";
}

export interface ConversationNote {
  id: string; author: string; text: string; at: string;
}

export interface ConversationDecision {
  decision: AgentDecision;
  reply: string;
  language: string;
  confidence: number;
  sources: { id: string; name: string; score: number }[];
  command?: string;
  action?: string;
  ruleApplied?: string;
  handover?: { route: string; reason: string };
  latencyMs: number;
  tokensEstimate: number;
  sentiment: "positive" | "neutral" | "negative";
}

export interface TestScenario {
  id: string;
  label: string;
  category:
    | "sales" | "support" | "appointment" | "complaint" | "pricing"
    | "unsupported" | "handover" | "multilingual" | "language_switch";
  messages: string[];
}
export interface Lead {
  id: string; name: string; email?: string; phone?: string; source: Channel;
  intent: string; score: number;
  stage: "new" | "qualified" | "booked" | "won" | "lost";
  owner: string; createdAt: string;
}
export interface Appointment {
  id: string; title: string; contact: string; channel: Channel;
  when: string; duration: number; agentId: string;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
}
export interface Call {
  id: string; contact: string; direction: "inbound" | "outbound";
  agentId: string; duration: number;
  outcome: "booked" | "qualified" | "voicemail" | "no-answer" | "transferred";
  when: string; recordingUrl?: string; transcript?: string;
}
export interface KnowledgeItem {
  id: string; title: string; type: "doc" | "url" | "faq" | "file";
  size: string; updatedAt: string; agents: string[];
  status: "indexed" | "processing" | "error";
}
export interface Workflow {
  id: string; name: string; trigger: string; steps: number; runs: number;
  status: "active" | "paused" | "draft"; updatedAt: string;
}
export interface Integration {
  id: string; name: string;
  category: "channels" | "calendar" | "crm" | "payments" | "automation" | "storage";
  connected: boolean; icon: string; description: string;
}
export interface TeamMember {
  id: string; name: string; email: string;
  role: "owner" | "admin" | "manager" | "agent";
  status: "active" | "invited"; avatar: string; lastActive: string;
}

// ─── Knowledge Engine ──────────────────────────────────────────────────

export type KSourceKind =
  | "pdf" | "docx" | "txt" | "csv" | "url" | "faq"
  | "product" | "service" | "policy" | "sop" | "manual" | "note";

export type KSourceStatus =
  | "uploading" | "processing" | "indexed" | "ready" | "failed" | "archived";

export type KPermission = "all" | "sales" | "support" | "receptionist" | "internal" | "custom";

export interface KVersion {
  id: string;
  version: number;
  createdAt: string;
  note: string;
  size: string;
  status: KSourceStatus;
}

export interface KSource {
  id: string;
  name: string;
  kind: KSourceKind;
  collectionId: string;
  language: string;
  version: number;
  status: KSourceStatus;
  uploadedAt: string;
  updatedAt: string;
  size: string;
  active: boolean;
  permission: KPermission;
  agentIds: string[];                // when permission = "custom"
  sourceUrl?: string;
  tags: string[];
  chunks: number;
  history: KVersion[];
}

export interface KCollection {
  id: string;
  name: string;
  description: string;
  color: string;                     // tailwind color token e.g. "sky", "emerald"
  agentIds: string[];
  createdAt: string;
}

export interface KFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: string;
  active: boolean;
  collectionId: string;
  updatedAt: string;
}

export interface KProduct {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: string;
  category: string;
  availability: "in_stock" | "out_of_stock" | "preorder" | "discontinued";
  images: string[];
  relatedProductIds: string[];
  collectionId: string;
  updatedAt: string;
}

export interface KService {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: string;
  availability: "available" | "waitlist" | "unavailable";
  collectionId: string;
  updatedAt: string;
}

export interface KWebsiteImport {
  id: string;
  rootUrl: string;
  mode: "homepage" | "entire_site" | "selected";
  pages: string[];
  status: KSourceStatus;
  createdAt: string;
  collectionId: string;
}

export interface KSearchHit {
  sourceId: string;
  sourceName: string;
  kind: KSourceKind;
  snippet: string;
  score: number;                     // 0–1
}

export interface KTestResult {
  question: string;
  answer: string;
  confidence: number;                // 0–1
  processingMs: number;
  sources: KSearchHit[];
  missing: boolean;
}

export interface KAnalytics {
  mostUsedSources: { sourceId: string; name: string; uses: number }[];
  topSearches: { query: string; count: number }[];
  unanswered: { query: string; count: number; lastAt: string }[];
  lowConfidence: { query: string; confidence: number; at: string }[];
  missingAreas: string[];
  uploads: { day: string; count: number }[];
  totals: { sources: number; faqs: number; products: number; services: number; indexed: number };
}