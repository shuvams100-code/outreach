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
  category: "outbound" | "inbound" | "data" | "followup" | "custom";
  enabled_tools: string[];
  sources_enabled: boolean; // turn on the lead-gen scrapers
  system_prompt: string;    // "" for data-only / custom (no calling agent to script)
  first_message: string;
  success_definition: string;
  script_variant?: string;  // variant of the script for same tool set (e.g., "appointment_setting", "db_reactivation")
};

const DEFAULT_MODEL = { provider: "openai", model: "gpt-4o-mini" };
// VAPI-native voice (provider "vapi") — confirmed free with just the VAPI account, no 11labs/PlayHT/etc
// key needed. Locked 2026-07-01: default new accounts to this, not 11labs, since 11labs bills separately
// and this is meant to run at real outbound volume (tenant-0 dogfooding) before any client is paying.
const DEFAULT_VOICE = { provider: "vapi", voiceId: "Elliot" };
const ALL_SOURCES = [
  { key: "google_maps", enabled: true },
  { key: "yellow_pages", enabled: true },
  { key: "hotfrog", enabled: true },
];

// 2026-07-02: outbound calling (outbound_sales, lead_qualification, ai_reminders, list_clean) removed
// entirely — TCPA risk (AI-voice cold-calling non-consented leads). Reminders-after-booking survives,
// but only as a consent-gated add-on inside inbound_receptionist (see reminders.ts) — not a preset,
// since it never changes which tools are granted, only whether the reminder sweep may call a booking.
export const PRESETS: Record<string, Preset> = {
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
  lead_enrich: {
    key: "lead_enrich",
    label: "Lead Enrichment",
    description: "Research each lead — website, email, profile, ICP fit — no calling.",
    category: "data",
    enabled_tools: [],
    sources_enabled: true, // enrichment scraping only
    system_prompt: "",
    first_message: "",
    success_definition: "Enriched lead list with website, email, profile, and ICP fit.",
  },
};

const uniq = (xs: string[]) => [...new Set(xs)];

// Script variants: same tool set + endings, different agent script for a different use case.
// These are NOT separate presets — they're prompt variations selected at apply time.
// `label` is the short dropdown line; `prompt` is the actual system_prompt sent to the model.
// Omit `prompt` (the "default" variant) to fall back to the preset's own system_prompt.
// Data-only presets (no calling agent) list variants for labelling only — their prompt is never used.
export type ScriptVariant = { label: string; prompt?: string };

export const SCRIPT_VARIANTS: Record<string, Record<string, ScriptVariant>> = {
  inbound_receptionist: {
    default: { label: "Receptionist (business hours)" },
  },
  lead_gen: {
    default: { label: "Scrape + enrich" },
    icp_prospecting: { label: "ICP → search terms → scrape" }, // data-only: label only
  },
  complaint_intake: {
    default: { label: "Log complaint with order ID" },
  },
  lead_enrich: {
    default: { label: "Enrich with website, email, profile, ICP fit" },
  },
};

// Resolve a preset + chosen variant into the actual system_prompt to use.
// No variant → the preset's own prompt. Variant with `prompt` → that prompt. Variant without
// `prompt` (a "default"-style entry) → fall back to the preset's prompt. Unknown variant → throw.
function resolveVariantPrompt(preset: Preset, variant?: string): string {
  if (!variant) return preset.system_prompt;
  const registry = SCRIPT_VARIANTS[preset.key];
  const v = registry?.[variant];
  if (!v) {
    const known = Object.keys(registry ?? {}).join(", ") || "(none)";
    throw new Error(`Unknown script_variant "${variant}" for preset "${preset.key}". One of: ${known}`);
  }
  return v.prompt ?? preset.system_prompt;
}

// A client's own hand-written script. When provided, it OVERRIDES the preset/variant text and is
// fed to VAPI verbatim — the agent follows the client's exact words. The preset still decides the
// plumbing (tools, scraping, success metric); only the spoken script is replaced.
export type ScriptOverride = {
  system_prompt: string;          // the exact script — sent to VAPI as-is
  first_message?: string;         // optional opening line; falls back to the preset's
  success_definition?: string;    // optional; falls back to the preset's
};

export type BuildOptions = {
  voiceId?: string;
  voiceProvider?: string;         // which voice service voiceId belongs to — "vapi" (default, free), "11labs", etc.
  override?: ScriptOverride;      // client's custom script (takes precedence over preset script)
};

// Pure (unit-tested): compose one OR MANY presets into the account fields to write. Unions the endings,
// ORs the scraping, and layers the scripts (so a Receptionist + Sales account becomes one agent that
// covers both). Presets with no script (data-only / custom) don't overwrite the agent — left manual.
// presets can be Preset objects (with script_variant) or just preset keys as strings.
// A ScriptOverride (the client's own script) replaces the composed script and is fed to VAPI verbatim.
// Back-compat: a bare voiceId string is still accepted as the second arg.
export function buildPresetUpdate(
  presets: (Preset | { key: string; script_variant?: string })[],
  opts?: string | BuildOptions,
) {
  const { voiceId, voiceProvider, override } = typeof opts === "string" ? { voiceId: opts, voiceProvider: undefined, override: undefined } : (opts ?? {});
  // Normalize to Preset objects, resolving each chosen variant into the actual system_prompt.
  const normalized = presets.map((p) => {
    const preset = "system_prompt" in p ? p : PRESETS[p.key];
    if (!preset) throw new Error(`Unknown preset "${p.key}"`);
    const script_variant = p.script_variant ?? preset.script_variant;
    return { ...preset, script_variant, system_prompt: resolveVariantPrompt(preset, script_variant) };
  });

  const enabled_tools = uniq(normalized.flatMap((p) => p.enabled_tools));
  const sources_enabled = normalized.some((p) => p.sources_enabled);
  const scripted = normalized.filter((p) => p.system_prompt.trim());

  // Every calling agent must be able to honor a do-not-call request (TCPA) — always include opt-out.
  if (scripted.length && !enabled_tools.includes("opt_out_customer")) enabled_tools.push("opt_out_customer");

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
      scripted.map((p) => `■ ${p.label}${p.script_variant ? ` (${p.script_variant})` : ""}: ${p.system_prompt}`).join("\n\n");
    base.first_message = scripted[0].first_message;
    base.success_definition = scripted.map((p) => p.success_definition).join("  ·  ");
  }
  // scripted.length === 0 → data-only / custom: don't set a script (leave the agent manual).

  // Client's own script wins: replace the composed script and feed it to VAPI verbatim.
  // first_message / success_definition fall back to whatever the preset(s) composed.
  if (override?.system_prompt?.trim()) {
    base.system_prompt = override.system_prompt;
    base.first_message = override.first_message ?? base.first_message ?? "";
    base.success_definition = override.success_definition ?? base.success_definition ?? "";
  }

  if (base.system_prompt) {
    base.vapi_assistant = {
      model: { ...DEFAULT_MODEL, messages: [{ role: "system", content: base.system_prompt }] },
      // Bug fixed 2026-07-01: this used to hardcode provider "11labs" for ANY custom voiceId, which would
      // silently mis-route a VAPI-native or other-provider voice ID under the wrong provider. Defaults to
      // "vapi" (matches DEFAULT_VOICE) unless the caller says otherwise.
      voice: voiceId ? { provider: voiceProvider ?? "vapi", voiceId } : DEFAULT_VOICE,
      firstMessage: base.first_message,
    };
  }
  return base;
}

export function listPresets() {
  return Object.values(PRESETS).map((p) => ({ key: p.key, label: p.label, description: p.description, category: p.category }));
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === "object" && !Array.isArray(v) && result[k] && typeof result[k] === "object" && !Array.isArray(result[k])) {
      result[k] = deepMerge(result[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// Apply one or more presets to an account (composed). Leaves client-specific fields alone.
// vapi_assistant is deep-merged so custom tools/temperature/etc. the client configured are preserved.
// keys can be strings (preset key) or objects { key: string; script_variant?: string }
// Pass a ScriptOverride to feed the client's own hand-written script to VAPI verbatim.
export async function applyPreset(
  accountId: string,
  keys: string | string[] | Array<string | { key: string; script_variant?: string }>,
  opts?: string | BuildOptions
) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const presets = keyList.map((k) => {
    if (typeof k === "string") return PRESETS[k];
    const p = PRESETS[k.key];
    if (!p) throw new Error(`Unknown preset "${k.key}". One of: ${Object.keys(PRESETS).join(", ")}`);
    return { ...p, script_variant: k.script_variant ?? p.script_variant };
  });
  const update = buildPresetUpdate(presets, opts);

  if (update.vapi_assistant) {
    const { data: existing } = await supabase.from("accounts").select("vapi_assistant").eq("id", accountId).single();
    if (existing?.vapi_assistant) {
      update.vapi_assistant = deepMerge(
        existing.vapi_assistant as Record<string, unknown>,
        update.vapi_assistant as Record<string, unknown>,
      );
    }
  }

  const { error } = await supabase.from("accounts").update(update).eq("id", accountId);
  if (error) throw new Error(`Applying preset(s) failed: ${error.message}`);
  return { applied: presets.map((p) => p.label), enabled_tools: update.enabled_tools, scraping: update.scraping_enabled };
}
