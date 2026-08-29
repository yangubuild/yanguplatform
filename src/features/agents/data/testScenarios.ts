// Fixed test prompts used by the Agent Builder sandbox. These are inputs only —
// every reply comes from the real conversation engine, never from a mock.
import type { TestScenario } from "./types";

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
