import { supabase } from "./lib/supabase";

// Use-case presets: one pick at onboarding stamps the right defaults onto an account — which endings
// (tools) the agent gets, whether it scrapes, the agent's script, and what counts as success.
// Client-specific fields (phone, calendar, knowledge base, ICP) stay manual; a preset never touches them.
// This is the data-driven core behind the one-click onboarding dropdown.

export type Preset = {
  key: string;
  label: string;
  description: string;
  direction: "outbound" | "inbound" | "both";
  enabled_tools: string[];
  sources_enabled: boolean; // turn on the lead-gen scrapers (outbound use cases that need leads)
  system_prompt: string;
  first_message: string;
  success_definition: string;
};

const DEFAULT_MODEL = { provider: "openai", model: "gpt-4o-mini" };
const DEFAULT_VOICE = { provider: "11labs", voiceId: "TX3LPaxmHKxFdv7VOQHJ" };
const ALL_SOURCES = [
  { key: "google_maps", enabled: true },
  { key: "yellow_pages", enabled: true },
  { key: "hotfrog", enabled: true },
];

export const PRESETS: Record<string, Preset> = {
  outbound_sales: {
    key: "outbound_sales",
    label: "Outbound Sales (AI SDR)",
    description: "Cold-calls prospects, qualifies, and books demos on the calendar.",
    direction: "outbound",
    enabled_tools: ["check_availability", "book_appointment"],
    sources_enabled: true,
    system_prompt:
      "You are a warm, sharp, persuasive (never pushy) outbound sales rep calling on behalf of the business described in your context. Your goal is to book a short meeting or demo. Ask one question at a time and keep it natural, like a real phone call. Qualify lightly and handle objections politely — push through two or three before bowing out gracefully. When they agree, call check_availability, offer the times, then book_appointment to lock it in. Never sound robotic or scripted.",
    first_message: "Hi, this is the team calling — did I catch you at an okay moment?",
    success_definition: "A booked, qualified meeting on the calendar.",
  },
  inbound_receptionist: {
    key: "inbound_receptionist",
    label: "AI Receptionist (Inbound)",
    description: "Answers calls, replies to questions, books appointments, or takes a message.",
    direction: "inbound",
    enabled_tools: ["check_availability", "book_appointment", "capture_fields"],
    sources_enabled: false,
    system_prompt:
      "You are a friendly, professional receptionist answering calls for the business described in your context. Greet warmly and find out what the caller needs. Answer their questions accurately using what you know about the business. If they want an appointment, call check_availability then book_appointment. If you can't fully help, or they'd like a callback, use capture_fields to record their name, number, and what they need so the team follows up. Never leave a caller without a resolution.",
    first_message: "Thanks for calling — how can I help you today?",
    success_definition: "The caller's need handled — answered, booked, or a message captured.",
  },
  lead_qualification: {
    key: "lead_qualification",
    label: "Lead Qualification",
    description: "Calls leads, asks the qualifying questions, scores and records the answers.",
    direction: "outbound",
    enabled_tools: ["capture_fields"],
    sources_enabled: true,
    system_prompt:
      "You are calling to qualify prospects for the business described in your context. Ask the qualifying questions naturally, one at a time. Once you've gathered the answers, call capture_fields to save them along with whether the prospect is a good fit (qualified true or false). Be efficient and respectful of their time.",
    first_message: "Hi, this is the team — do you have a quick minute?",
    success_definition: "Qualification answers captured for every reachable lead.",
  },
  complaint_intake: {
    key: "complaint_intake",
    label: "Complaint / Support Line",
    description: "Answers, understands the issue, captures the complaint with the order ID.",
    direction: "inbound",
    enabled_tools: ["capture_fields"],
    sources_enabled: false,
    system_prompt:
      "You are a calm, empathetic support agent answering for the business described in your context. Let the caller explain their problem fully and acknowledge their frustration. Gather the key details — including any order or reference number. Then call capture_fields to log the complaint (set type to \"complaint\") with the order id and details. Reassure them the team will follow up, but never promise something you can't guarantee.",
    first_message: "Thanks for calling support — I'm here to help. What's going on?",
    success_definition: "Complaint logged with order ID and details for follow-up.",
  },
};

// Pure (unit-tested): turn a preset into the exact account fields to write. Assembles the VAPI assistant
// from the preset's script + a default voice/model. Does NOT include any client-specific field.
export function buildPresetUpdate(preset: Preset, voiceId?: string) {
  return {
    enabled_tools: preset.enabled_tools,
    sources: preset.sources_enabled ? ALL_SOURCES : [],
    scraping_enabled: preset.sources_enabled,
    system_prompt: preset.system_prompt,
    first_message: preset.first_message,
    success_definition: preset.success_definition,
    vapi_assistant: {
      model: { ...DEFAULT_MODEL, messages: [{ role: "system", content: preset.system_prompt }] },
      voice: voiceId ? { provider: "11labs", voiceId } : DEFAULT_VOICE,
      firstMessage: preset.first_message,
    },
  };
}

export function listPresets() {
  return Object.values(PRESETS).map((p) => ({ key: p.key, label: p.label, description: p.description, direction: p.direction }));
}

// Apply a preset to an account (fills the use-case defaults; leaves client-specific fields alone).
export async function applyPreset(accountId: string, presetKey: string, voiceId?: string) {
  const preset = PRESETS[presetKey];
  if (!preset) throw new Error(`Unknown preset "${presetKey}". One of: ${Object.keys(PRESETS).join(", ")}`);
  const update = buildPresetUpdate(preset, voiceId);
  const { error } = await supabase.from("accounts").update(update).eq("id", accountId);
  if (error) throw new Error(`Applying preset failed: ${error.message}`);
  return { applied: preset.label, enabled_tools: update.enabled_tools, scraping: update.scraping_enabled };
}
