import { applyPreset } from "../../../../src/presets";

// Ops-facing service name -> engine preset key(s) that grant its tools. The frontend's own edited
// script (config.scriptText) always wins over the preset's canned prompt (see activateService below) —
// presets here only decide WHICH TOOLS the agent gets, not what it says.
export const SERVICE_PRESET_KEYS = {
  "Outbound Sales / Appt Setting": ["outbound_sales"],
  "Reactivation & Renewals": ["outbound_sales"],
  "Lead Qualification": ["lead_qualification"], // + "outbound_sales" when recruitmentEnabled — see activateService
  "Appointment Reminders": ["ai_reminders"],
  "AI Receptionist": ["inbound_receptionist"],
  "Support / Complaint Line": ["complaint_intake"],
  "Lead Generation": ["lead_gen"],
  "List Cleaning": ["list_clean"],
  "Lead Enrichment": ["lead_enrich"],
};

function presetKeysFor(serviceKey, config) {
  const base = SERVICE_PRESET_KEYS[serviceKey] ?? [];
  // Recruitment screening needs booking tools on top of capture_fields — stack outbound_sales for them.
  if (serviceKey === "Lead Qualification" && config?.recruitmentEnabled) return [...base, "outbound_sales"];
  return base;
}

// Client-specific fields the frontend's config maps to `accounts` columns. Only includes a key when the
// source field is present on `config` — so activating one service never clobbers another service's
// columns (e.g. activating Appointment Reminders never touches qualifying_questions, since its config
// object has no such field). Shared columns (icp/offer/knowledge/booking/phone/hours/retry/enrichment)
// are genuinely shared across services on one account today — last save wins. That's an honest reflection
// of the engine's one-assistant-per-account model, not a bug; a per-direction assistant is a bigger,
// separate change (tracked in docs/mock-and-wiring.md).
export function buildClientFields(config, accountTimezone) {
  const f = {};
  const set = (col, val) => { if (val !== undefined) f[col] = val; };

  set("icp_description", config.icpDescription);
  set("offer", config.clientOffer);
  set("broker_knowledge_base", config.knowledgeBase);
  set("scraping_enabled", config.isScrapeChecked);
  set("geo_city", config.scrapeCity);
  set("geo_state", config.scrapeState);
  set("geo_radius_km", config.scrapeRadius ? Number(config.scrapeRadius) : undefined);
  // NOTE: deliberately NOT writing scrapeBusinessType to `business_type` — that column already holds the
  // account's own industry (set at onboarding). The engine derives its actual scrape search term from
  // icp_description via icp.ts deriveSearchTerm, not from this free-text hint, so it has nowhere safe to
  // live as a column yet; it stays inside service_configs (saved below) for display only.
  if (config.scrapeSources) set("sources", config.scrapeSources.map((key) => ({ key, enabled: true })));

  if (config.qualifyingQuestions !== undefined || config.qualifiedCriteria !== undefined) {
    set("qualifying_questions", {
      questions: (config.qualifyingQuestions ?? []).filter((q) => q && q.trim()),
      qualified_criteria: config.qualifiedCriteria ?? "",
    });
  }

  if (config.maxCallAttempts !== undefined || config.retryGapDays !== undefined) {
    set("retry_rules", { max_attempts: Number(config.maxCallAttempts ?? 3), gap_days: Number(config.retryGapDays ?? 3) });
  }
  set("daily_dial_cap", config.dailyCapPerNumber ? Number(config.dailyCapPerNumber) : undefined);
  set("max_call_duration_seconds", config.maxCallLength ? Number(config.maxCallLength) * 60 : undefined);
  set("lead_cap_per_run", config.maxLeadsPerRun ? Number(config.maxLeadsPerRun) : undefined);
  set("enrichment_enabled", config.enrichEnabled);
  set("enrichment_depth", config.enrichmentDepth);

  set("calling_hours_start", config.callingHoursStart);
  set("calling_hours_end", config.callingHoursEnd);

  if (config.meetingMode !== undefined) {
    set("booking", {
      timezone: config.callingTimezone || accountTimezone || "America/New_York",
      duration_minutes: Number(config.meetingLength ?? 30),
      buffer_minutes: Number(config.meetingBuffer ?? 15),
      day_start_hour: Number((config.callingHoursStart ?? "09:00").split(":")[0]),
      day_end_hour: Number((config.callingHoursEnd ?? "18:00").split(":")[0]),
      horizon_days: 14,
      meeting_mode: config.meetingMode === "In-person" ? "in_person" : config.meetingMode === "Online" ? "online" : "both",
      meeting_link: config.meetingLink || null,
      address: config.meetingAddress || null,
      windows: config.availabilityWindows,
    });
    set("booking_capacity", config.bookingCapacity ? Number(config.bookingCapacity) : undefined);
  }

  // Appointment Reminders — no dedicated column exists for auto-link/timing yet, and stuffing them into
  // an unrelated column (e.g. retry_rules) would be a misleading name for what they are. They're already
  // fully preserved in service_configs (below); the reminder sweep reads them from there once it's gated
  // to paid accounts (tracked TODO in docs/mock-and-wiring.md) rather than from a repurposed column.

  // AI Receptionist / Support Line — warm transfer + coverage.
  if (config.warmTransferNumber !== undefined) set("warm_transfer_number", config.warmTransferEnabled ? config.warmTransferNumber : null);
  if (config.warmTransferHoursStart !== undefined) {
    set("warm_transfer_hours", config.warmTransferEnabled ? `${config.warmTransferHoursStart}-${config.warmTransferHoursEnd}` : null);
  }

  return f;
}

// Activate (or re-save) one named service on an account: grants its tools via applyPreset (composed
// across every OTHER currently-active service too, so enabled_tools/sources stay the union of everything
// switched on), persists the client-specific fields, and records it in service_configs/active_services.
export async function activateService(supabase, accountId, serviceKey, config) {
  const { data: acct, error: readErr } = await supabase
    .from("accounts")
    .select("service_configs, active_services, broker_timezone")
    .eq("id", accountId)
    .single();
  if (readErr || !acct) throw new Error(`Account ${accountId} not found: ${readErr?.message}`);

  const serviceConfigs = { ...(acct.service_configs ?? {}), [serviceKey]: config };
  const activeServices = [...new Set([...(acct.active_services ?? []), serviceKey])];

  // Union the preset keys of every active service so tools/sources reflect everything switched on,
  // not just the one being (re)activated.
  const allPresetKeys = [...new Set(activeServices.flatMap((k) => presetKeysFor(k, serviceConfigs[k])))];

  // Only override the spoken script when exactly one service is active — with more than one, let
  // buildPresetUpdate's own multi-role composition take over (see presets.ts). Single-assistant-per-
  // account is a known limitation; a per-direction assistant is a separate, bigger change.
  const override = activeServices.length === 1 && config.scriptText?.trim()
    ? { system_prompt: config.scriptText, first_message: config.openingLine, success_definition: config.successMetric }
    : undefined;

  // config.voiceSelection is a real VAPI-native voice name (e.g. "Elliot") or "default" for DEFAULT_VOICE.
  // voiceProvider "vapi" — these are the free, built-in VAPI voices confirmed via the real API 2026-07-01.
  await applyPreset(accountId, allPresetKeys, {
    voiceId: config.voiceSelection === "default" ? undefined : config.voiceSelection,
    voiceProvider: "vapi",
    override,
  });

  const clientFields = buildClientFields(config, acct.broker_timezone);
  const { error: updErr } = await supabase
    .from("accounts")
    .update({ ...clientFields, service_configs: serviceConfigs, active_services: activeServices, status: "active" })
    .eq("id", accountId);
  if (updErr) throw new Error(`Saving service fields failed: ${updErr.message}`);

  return { activeServices, presetKeys: allPresetKeys };
}

// Save a service's config WITHOUT switching it on — no tool grant, no applyPreset call, and it never
// touches active_services either way (works whether the service was already active or not). Used by
// the config screen's "Save Draft" action.
export async function saveServiceDraft(supabase, accountId, serviceKey, config) {
  const { data: acct, error: readErr } = await supabase.from("accounts").select("service_configs").eq("id", accountId).single();
  if (readErr || !acct) throw new Error(`Account ${accountId} not found: ${readErr?.message}`);
  const serviceConfigs = { ...(acct.service_configs ?? {}), [serviceKey]: config };
  const { error: updErr } = await supabase.from("accounts").update({ service_configs: serviceConfigs }).eq("id", accountId);
  if (updErr) throw new Error(`Saving draft failed: ${updErr.message}`);
  return { serviceConfigs };
}

// Deactivate (mode: "off") keeps the saved config for later re-activation; delete (mode: "delete") drops
// it entirely. Either way, tools/sources are recomposed from whatever services remain active.
export async function deactivateService(supabase, accountId, serviceKey, mode = "off") {
  const { data: acct, error: readErr } = await supabase
    .from("accounts")
    .select("service_configs, active_services")
    .eq("id", accountId)
    .single();
  if (readErr || !acct) throw new Error(`Account ${accountId} not found: ${readErr?.message}`);

  const activeServices = (acct.active_services ?? []).filter((k) => k !== serviceKey);
  const serviceConfigs = { ...(acct.service_configs ?? {}) };
  if (mode === "delete") delete serviceConfigs[serviceKey];

  const allPresetKeys = [...new Set(activeServices.flatMap((k) => presetKeysFor(k, serviceConfigs[k])))];
  if (allPresetKeys.length) {
    // Exactly one service left active → restore ITS saved script (else the prompt would silently fall
    // back to the preset's generic default text instead of what was actually configured for it).
    const remaining = activeServices.length === 1 ? serviceConfigs[activeServices[0]] : null;
    const override = remaining?.scriptText?.trim()
      ? { system_prompt: remaining.scriptText, first_message: remaining.openingLine, success_definition: remaining.successMetric }
      : undefined;
    await applyPreset(accountId, allPresetKeys, { override });
  } else {
    // Nothing left active — clear the agent config so it never dials/answers on stale settings.
    await supabase.from("accounts").update({ enabled_tools: [], system_prompt: null, first_message: null, scraping_enabled: false }).eq("id", accountId);
  }

  const status = activeServices.length > 0 ? "active" : "onboarding";
  const { error: updErr } = await supabase
    .from("accounts")
    .update({ service_configs: serviceConfigs, active_services: activeServices, status })
    .eq("id", accountId);
  if (updErr) throw new Error(`Deactivating service failed: ${updErr.message}`);

  return { activeServices };
}
