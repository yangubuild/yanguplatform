export type AgentType = "sales" | "receptionist" | "support" | "knowledge";
export type AgentStatus = "live" | "draft" | "paused";
export type Channel = "whatsapp" | "web" | "voice" | "instagram" | "email" | "sms";

export interface Agent {
  id: string; name: string; type: AgentType; status: AgentStatus;
  channels: Channel[]; language: string; voice: string;
  conversationsToday: number; leadsThisWeek: number; handoverRate: number;
  updatedAt: string; description: string;
}
export interface Message {
  id: string; role: "customer" | "agent" | "human" | "system"; text: string; at: string;
}
export interface Conversation {
  id: string; contactName: string; contactHandle: string; channel: Channel;
  agentId: string; lastMessage: string; unread: number; updatedAt: string;
  status: "open" | "handover" | "closed"; messages: Message[];
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