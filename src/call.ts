import { supabase } from "./lib/supabase";
import type { RetryRules } from "./outcome";

const VAPI_BASE = "https://api.vapi.ai";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DEFAULT_RETRY: RetryRules = { max_attempts: 3, gap_days: 3 };

export type CallAccount = {
  vapi_phone_numbers: string[];
  vapi_assistant: Record<string, unknown> | null;
};

// Append extra system messages to an assistant for one call: the account's knowledge base (so the
// agent can answer questions about the client's business) and per-lead research (so it knows who it's
// calling). Returns undefined when there's nothing to add. Pure + unit-tested; any account's assistant.
export function buildCallOverrides(
  assistant: Record<string, any> | null,
  opts: { knowledgeBase?: string | null; businessName?: string | null; profile?: string | null },
): Record<string, unknown> | undefined {
  const extra: { role: string; content: string }[] = [];
  if (opts.knowledgeBase?.trim()) {
    extra.push({
      role: "system",
      content: `ABOUT THE BUSINESS YOU REPRESENT (use this to answer questions accurately): ${opts.knowledgeBase.trim()}`,
    });
  }
  if (opts.profile?.trim()) {
    extra.push({
      role: "system",
      content:
        `CONTEXT FOR THIS CALL — you are calling ${opts.businessName || "this business"}. ` +
        `Here is what we researched about them: ${opts.profile.trim()} ` +
        `Use this naturally to be specific and relevant. Do NOT read it aloud or mention that you researched them.`,
    });
  }
  if (!extra.length) return undefined;
  const baseModel = (assistant?.model as Record<string, any>) ?? {};
  const baseMessages = Array.isArray(baseModel.messages) ? baseModel.messages : [];
  return { model: { ...baseModel, messages: [...baseMessages, ...extra] } };
}

export async function loadCallAccount(accountId: string): Promise<CallAccount> {
  const { data, error } = await supabase
    .from("accounts")
    .select("vapi_phone_numbers, vapi_assistant")
    .eq("id", accountId)
    .single();
  if (error || !data) throw new Error(`Account ${accountId} not found: ${error?.message}`);
  return data as CallAccount;
}

// Place one outbound call. The assistant (script/voice/model) comes entirely from the
// account row — the engine hardcodes nothing per client. Returns the VAPI call id.
export async function placeCall(
  account: CallAccount,
  toNumber: string,
  name?: string,
  metadata?: Record<string, unknown>,
  assistantOverrides?: Record<string, unknown>,
): Promise<string> {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error("Missing VAPI_API_KEY in .env");
  const phoneNumberId = account.vapi_phone_numbers?.[0];
  if (!phoneNumberId) throw new Error("Account has no VAPI phone number configured (vapi_phone_numbers)");
  if (!account.vapi_assistant) throw new Error("Account has no VAPI assistant configured (vapi_assistant)");

  const res = await fetch(`${VAPI_BASE}/call`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumberId,
      customer: { number: toNumber, ...(name ? { name } : {}) },
      assistant: account.vapi_assistant,
      // ponytail: amd routes voicemail to endedReason "voicemail" → no_answer retry (not_interested burn).
      // Verify field name at api.vapi.ai/api#/Calls/CallController_create if this has no effect.
      amd: { enabled: true },
      ...(metadata ? { metadata } : {}),
      ...(assistantOverrides ? { assistantOverrides } : {}),
    }),
  });
  if (!res.ok) throw new Error(`VAPI create-call failed (${res.status}): ${await res.text()}`);
  const call = (await res.json()) as { id: string };
  return call.id;
}

export type CallResult = {
  id: string;
  status: string;
  endedReason?: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
  analysis?: { structuredData?: { outcome?: string } };
};

// Poll until the call ends. Used for local dev / scripts — production uses the VAPI end-of-call webhook.
// ponytail: polling blocks for up to 4 min. Wire up POST /api/webhook/vapi → processVapiCallEnd (webhook-vapi.ts)
// and remove this call from callContact before deploying to Vercel.
export async function pollCall(callId: string, timeoutMs = 240000, intervalMs = 5000): Promise<CallResult> {
  const key = process.env.VAPI_API_KEY;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${VAPI_BASE}/call/${callId}`, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`VAPI get-call failed (${res.status}): ${await res.text()}`);
    const call = (await res.json()) as CallResult;
    if (call.status === "ended") return call;
    await sleep(intervalMs);
  }
  throw new Error(`Call ${callId} did not end within ${timeoutMs / 1000}s`);
}

// Minimal inline calling-window check — re-checks just before dialing in case the window closed
// during a long run. Avoids a circular import with daily.ts (which imports callContact).
function isCurrentlyCallable(timezone: string | null | undefined, startHour: number, endHour: number): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone ?? "America/New_York",
      weekday: "short", hour: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const weekday = parts.find(p => p.type === "weekday")?.value ?? "";
    if (["Sat", "Sun"].includes(weekday)) return false;
    const hour = parseInt(parts.find(p => p.type === "hour")?.value ?? "0", 10);
    return hour >= startHour && hour < endHour;
  } catch {
    return false; // unknown timezone → don't dial
  }
}

// Full outbound cycle for one contact: compliance checks → place call → return.
// Outcome processing (classify → log → update lead) happens in processVapiCallEnd (webhook-vapi.ts)
// when VAPI fires its end-of-call webhook. This keeps callContact non-blocking (Vercel-safe).
export async function callContact(accountId: string, leadId: string): Promise<void> {
  const { data: acct, error: aErr } = await supabase
    .from("accounts")
    .select("vapi_phone_numbers, vapi_assistant, retry_rules, broker_knowledge_base, first_message, calling_hours_start, calling_hours_end")
    .eq("id", accountId)
    .single();
  if (aErr || !acct) throw new Error(`Account ${accountId} not found: ${aErr?.message}`);

  const { data: lead, error: lErr } = await supabase
    .from("leads")
    .select("id, phone, first_name, retry_count, business_name, business_profile, timezone")
    .eq("id", leadId)
    .eq("account_id", accountId)
    .single();
  if (lErr || !lead) throw new Error(`Lead ${leadId} not found: ${lErr?.message}`);

  // 1.1 JIT DNC: re-check opt_outs right before dialing (prospect may have opted out after scrubbing).
  const { data: blocked } = await supabase
    .from("opt_outs").select("id").eq("account_id", accountId).eq("phone", lead.phone).maybeSingle();
  if (blocked) {
    await supabase.from("leads").update({ state: "disqualified" }).eq("id", leadId);
    return;
  }

  // 1.3 JIT timezone safety: window may have closed since the list was built (long-running dial cycle).
  const startHour = parseInt(String(acct.calling_hours_start ?? "09:00").split(":")[0], 10);
  const endHour = parseInt(String(acct.calling_hours_end ?? "18:00").split(":")[0], 10);
  if (!isCurrentlyCallable(lead.timezone, startHour, endHour)) return;

  // Stamp last_called_at as we enter `calling` so a crashed run leaves a timestamp the reaper can find.
  await supabase.from("leads").update({ state: "calling", last_called_at: new Date().toISOString() }).eq("id", leadId);

  const overrides = buildCallOverrides(acct.vapi_assistant as Record<string, any> | null, {
    knowledgeBase: acct.broker_knowledge_base as string | null,
    businessName: lead.business_name,
    profile: lead.business_profile,
  });

  // 2.4 Outbound firstMessage: override the assistant's default (which may be the inbound greeting)
  // with the account's outbound opening line so cold prospects hear the right thing.
  const firstMessageOverride = acct.first_message
    ? { firstMessage: acct.first_message as string }
    : undefined;

  const assistantOverrides = (overrides || firstMessageOverride)
    ? { ...overrides, ...firstMessageOverride }
    : undefined;

  // 3.4 State rollback: if VAPI rejects the call (bad key, zero balance) revert to scrubbed so
  // this lead isn't permanently orphaned in `calling`.
  try {
    await placeCall(
      acct as CallAccount,
      lead.phone,
      lead.first_name ?? undefined,
      { account_id: accountId, lead_id: leadId },
      assistantOverrides,
    );
  } catch (err) {
    await supabase.from("leads").update({ state: "scrubbed" }).eq("id", leadId);
    throw err; // re-throw so the daily runner counts it as an error
  }
}
