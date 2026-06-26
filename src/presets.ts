import { supabase } from "./lib/supabase";

// Use-case presets: one (or several) picks at onboarding stamp the right defaults onto an account —
// which endings (tools) the agent gets, whether it scrapes, the agent's script, and what counts as
// success. Client-specific fields (phone, calendar, knowledge base, ICP) stay manual; presets never
// touch them. Presets are STACKABLE — pick more than one and the engine composes them (union the tools,
// layer the scripts). This is the data-driven core behind the one-click (multi-select) onboarding.

export type Preset = {
  key: string;
  label: string;
  description: string;
  category: "outbound" | "inbound" | "data" | "custom";
  enabled_tools: string[];
  sources_enabled: boolean; // turn on the lead-gen scrapers
  system_prompt: string;    // "" for data-only / custom (no calling agent to script)
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
    category: "outbound",
    enabled_tools: ["check_availability", "book_appointment"],
    sources_enabled: true,
    system_prompt:
      "You are a warm, sharp, persuasive (never pushy) outbound sales rep calling on behalf of the business described in your context. Your goal is to book a short meeting or demo. Ask one question at a time and keep it natural. Qualify lightly and handle objections politely. When they agree, call check_availability, offer the times, then book_appointment to lock it in.",
    first_message: "Hi, this is the team calling — did I catch you at an okay moment?",
    success_definition: "A booked, qualified meeting on the calendar.",
  },
  lead_qualification: {
    key: "lead_qualification",
    label: "Lead Qualification",
    description: "Calls leads, asks the qualifying questions, scores and records the answers (no booking).",
    category: "outbound",
    enabled_tools: ["capture_fields"],
    sources_enabled: true,
    system_prompt:
      "You are calling to qualify prospects for the business described in your context. Ask the qualifying questions naturally, one at a time. Once you've gathered the answers, call capture_fields to save them along with whether the prospect is a good fit (qualified true or false). Be efficient and respectful of their time.",
    first_message: "Hi, this is the team — do you have a quick minute?",
    success_definition: "Qualification answers captured for every reachable lead.",
  },
  inbound_receptionist: {
    key: "inbound_receptionist",
    label: "AI Receptionist (Inbound)",
    description: "Answers calls, replies to questions, books appointments, or takes a message.",
    category: "inbound",
    enabled_tools: ["check_availability", "book_appointment", "capture_fields"],
    sources_enabled: false,
    system_prompt:
      "You are a friendly, professional receptionist answering calls for the business described in your context. Greet warmly and find out what the caller needs. Answer their questions accurately using what you know about the business. If they want an appointment, call check_availability then book_appointment. If you can't fully help, or they'd like a callback, use capture_fields to record their name, number, and what they need. Never leave a caller without a resolution.",
    first_message: "Thanks for calling — how can I help you today?",
    success_definition: "The caller's need handled — answered, booked, or a message captured.",
  },
  complaint_intake: {
    key: "complaint_intake",
    label: "Complaint / Support Line",
    description: "Answers, understands the issue, captures the complaint with the order ID.",
    category: "inbound",
    enabled_tools: ["capture_fields"],
    sources_enabled: false,
    system_prompt:
      "You are a calm, empathetic support agent answering for the business described in your context. Let the caller explain their problem fully. Gather the key details — including any order or reference number. Then call capture_fields to log the complaint (set type to \"complaint\") with the order id and details. Reassure them the team will follow up.",
    first_message: "Thanks for calling support — I'm here to help. What's going on?",
    success_definition: "Complaint logged with order ID and details for follow-up.",
  },
  lead_gen: {
    key: "lead_gen",
    label: "Lead Generation (data only)",
    description: "Scrape, dedupe, enrich and clean leads — no calling. Deliver a list.",
    category: "data",
    enabled_tools: [],
    sources_enabled: true,
    system_prompt: "",
    first_message: "",
    success_definition: "A clean, deduped, enriched lead list ready to hand over.",
  },
  custom: {
    key: "custom",
    label: "Custom (blank)",
    description: "Nothing pre-filled. Toggle every setting on/off by hand.",
    category: "custom",
    enabled_tools: [],
    sources_enabled: false,
    system_prompt: "",
    first_message: "",
    success_definition: "",
  },
};

const uniq = (xs: string[]) => [...new Set(xs)];

// Pure (unit-tested): compose one OR MANY presets into the account fields to write. Unions the endings,
// ORs the scraping, and layers the scripts (so a Receptionist + Sales account becomes one agent that
// covers both). Presets with no script (data-only / custom) don't overwrite the agent — left manual.
export function buildPresetUpdate(presets: Preset[], voiceId?: string) {
  const enabled_tools = uniq(presets.flatMap((p) => p.enabled_tools));
  const sources_enabled = presets.some((p) => p.sources_enabled);
  const scripted = presets.filter((p) => p.system_prompt.trim());

  const base: Record<string, unknown> = {
    enabled_tools,
    sources: sources_enabled ? ALL_SOURCES : [],
    scraping_enabled: sources_enabled,
  };

  if (scripted.length === 1) {
    const p = scripted[0];
    base.system_prompt = p.system_prompt;
    base.first_message = p.first_message;
    base.success_definition = p.success_definition;
  } else if (scripted.length > 1) {
    base.system_prompt =
      "You are an AI voice agent for the business described in your context. You cover several roles — read the situation (an outbound call vs an inbound one, and what the caller wants) and use the right one:\n\n" +
      scripted.map((p) => `■ ${p.label}: ${p.system_prompt}`).join("\n\n");
    base.first_message = scripted[0].first_message;
    base.success_definition = scripted.map((p) => p.success_definition).join("  ·  ");
  }
  // scripted.length === 0 → data-only / custom: don't set a script (leave the agent manual).

  if (base.system_prompt) {
    base.vapi_assistant = {
      model: { ...DEFAULT_MODEL, messages: [{ role: "system", content: base.system_prompt }] },
      voice: voiceId ? { provider: "11labs", voiceId } : DEFAULT_VOICE,
      firstMessage: base.first_message,
    };
  }
  return base;
}

export function listPresets() {
  return Object.values(PRESETS).map((p) => ({ key: p.key, label: p.label, description: p.description, category: p.category }));
}

// Apply one or more presets to an account (composed). Leaves client-specific fields alone.
export async function applyPreset(accountId: string, keys: string | string[], voiceId?: string) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const presets = keyList.map((k) => {
    const p = PRESETS[k];
    if (!p) throw new Error(`Unknown preset "${k}". One of: ${Object.keys(PRESETS).join(", ")}`);
    return p;
  });
  const update = buildPresetUpdate(presets, voiceId);
  const { error } = await supabase.from("accounts").update(update).eq("id", accountId);
  if (error) throw new Error(`Applying preset(s) failed: ${error.message}`);
  return { applied: presets.map((p) => p.label), enabled_tools: update.enabled_tools, scraping: update.scraping_enabled };
}
