import { applyPreset } from "../../../../src/presets";

// 2026-07-02: Outbound Sales / Appt Setting, Reactivation & Renewals, Lead Qualification, Appointment
// Reminders, and List Cleaning removed entirely — TCPA risk (AI-voice cold-calling non-consented
// leads). 3 services remain. "No-Show Reduction" (the one calling feature that survived) is NOT a
// service/preset here — it's a paid add-on checkbox inside AI Receptionist's own config, gated on
// per-booking consent, not on tool grants. See reassertRemindersAddon below and docs/design-log.md.
//
// Ops-facing service name -> engine preset key(s) that grant its tools. The frontend's own edited
// script (config.scriptText) always wins over the preset's canned prompt (see activateService below) —
// presets here only decide WHICH TOOLS the agent gets, not what it says.
export const SERVICE_PRESET_KEYS = {
  "AI Receptionist": ["inbound_receptionist"],
  "Support / Complaint Line": ["complaint_intake"],
  // service 7 covers both generation and enrichment (enrichment isn't gated on generation — it also
  // runs on leads uploaded outside this service). Both preset keys are data-only (no tools/script),
  // so stacking them just keeps sources_enabled/scraping on.
  "Lead Generation": ["lead_gen", "lead_enrich"],
};

function presetKeysFor(serviceKey) {
  return SERVICE_PRESET_KEYS[serviceKey] ?? [];
}

// No-Show Reduction instruction, appended to AI Receptionist's system_prompt when the add-on is on.
const REMINDER_ADDON_MARKER = "NO-SHOW REDUCTION";
const REMINDER_ADDON_INSTRUCTION =
  `\n\n${REMINDER_ADDON_MARKER} (paid add-on, active for this account): once the caller agrees to book a NEW appointment, before calling book_appointment ask them: "Would it be okay if we call to remind you about this an hour before, and if you're not able to make it we'll be happy to help you reschedule?" Pass their answer as reminder_opt_in (true/false) in that same book_appointment call. Don't ask again when rescheduling an existing appointment — that consent already carries over.`;

// applyPreset recomposes system_prompt from scratch on every call (single- or multi-role) and has no
// idea about account-level add-ons like this one, so it must be reasserted after every activate/
// deactivate — not just when AI Receptionist itself is the service being touched, since activating or
// deactivating any OTHER service also rewrites the prompt out from under it.
async function reassertRemindersAddon(supabase, accountId, activeServices, serviceConfigs) {
  const on = activeServices.includes("AI Receptionist") && serviceConfigs["AI Receptionist"]?.remindersAddonEnabled === true;
  if (!on) return;
  const { data: cur } = await supabase.from("accounts").select("system_prompt").eq("id", accountId).single();
  if (cur?.system_prompt && !cur.system_prompt.includes(REMINDER_ADDON_MARKER)) {
    await supabase.from("accounts").update({ system_prompt: cur.system_prompt + REMINDER_ADDON_INSTRUCTION }).eq("id", accountId);
  }
}

// Client-specific fields the frontend's config maps to `accounts` columns. Only includes a key when the
// source field is present on `config` — so activating one service never clobbers another service's
// columns (e.g. activating Lead Generation never touches warm_transfer_number, since its config object
// has no such field). Shared columns (icp/offer/knowledge/booking/phone/hours/enrichment) are genuinely
// shared across services on one account today — last save wins. That's an honest reflection of the
// engine's one-assistant-per-account model, not a bug; a per-direction assistant is a bigger, separate
// change (tracked in docs/mock-and-wiring.md).
export function buildClientFields(config, accountTimezone) {
  const f = {};
  const set = (col, val) => { if (val !== undefined) f[col] = val; };

  set("icp_description", config.icpDescription);
  set("intent_signal_description", config.intentSignalDescription);
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

  set("lead_cap_per_run", config.maxLeadsPerRun ? Number(config.maxLeadsPerRun) : undefined);
  set("enrichment_enabled", config.enrichEnabled);
  set("enrichment_depth", config.enrichmentDepth);

  // No-Show Reduction — only AI Receptionist's own config object carries this field, so activating
  // any other service never touches it. Booking-level consent lives on `bookings.reminder_consent`
  // (captured live per-appointment); this is just the account-level "did they buy the add-on" switch.
  set("reminders_addon_enabled", config.remindersAddonEnabled);

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
  const allPresetKeys = [...new Set(activeServices.flatMap((k) => presetKeysFor(k)))];

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

  await reassertRemindersAddon(supabase, accountId, activeServices, serviceConfigs);

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

  const allPresetKeys = [...new Set(activeServices.flatMap((k) => presetKeysFor(k)))];
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
  // AI Receptionist itself going inactive takes the add-on with it — no receptionist, nothing to book
  // a reminder consent through.
  const remindersOff = serviceKey === "AI Receptionist" ? { reminders_addon_enabled: false } : {};
  const { error: updErr } = await supabase
    .from("accounts")
    .update({ service_configs: serviceConfigs, active_services: activeServices, status, ...remindersOff })
    .eq("id", accountId);
  if (updErr) throw new Error(`Deactivating service failed: ${updErr.message}`);

  await reassertRemindersAddon(supabase, accountId, activeServices, serviceConfigs);

  return { activeServices };
}
