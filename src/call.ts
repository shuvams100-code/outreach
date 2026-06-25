import { supabase } from "./lib/supabase";
import { classifyCall, type RetryRules, type VapiResult } from "./outcome";

const VAPI_BASE = "https://api.vapi.ai";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DEFAULT_RETRY: RetryRules = { max_attempts: 3, gap_days: 3 };

export type CallAccount = {
  vapi_phone_numbers: string[];
  vapi_assistant: Record<string, unknown> | null;
};

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
export async function placeCall(account: CallAccount, toNumber: string, name?: string): Promise<string> {
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

// Poll until the call ends (local dev — production will use VAPI end-of-call webhooks).
// ponytail: polling, not webhooks; swap to a webhook handler once deployed to Vercel.
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

// Full outbound cycle for one contact: place → wait → classify → log to `calls` → update lead.
// The orchestration (DB + VAPI); the pure decision lives in classifyCall (outcome.ts, unit-tested).
export async function callContact(accountId: string, leadId: string) {
  const { data: acct, error: aErr } = await supabase
    .from("accounts")
    .select("vapi_phone_numbers, vapi_assistant, retry_rules")
    .eq("id", accountId)
    .single();
  if (aErr || !acct) throw new Error(`Account ${accountId} not found: ${aErr?.message}`);
  const rules = (acct.retry_rules as RetryRules) ?? DEFAULT_RETRY;

  const { data: lead, error: lErr } = await supabase
    .from("leads")
    .select("id, phone, first_name, retry_count")
    .eq("id", leadId)
    .eq("account_id", accountId)
    .single();
  if (lErr || !lead) throw new Error(`Lead ${leadId} not found: ${lErr?.message}`);

  await supabase.from("leads").update({ state: "calling" }).eq("id", leadId);

  const callId = await placeCall(acct as CallAccount, lead.phone, lead.first_name ?? undefined);
  const result = await pollCall(callId);

  const now = new Date();
  const { outcome, lead: leadUpdate } = classifyCall(result as VapiResult, lead.retry_count ?? 0, rules, now);

  const duration = result.startedAt && result.endedAt
    ? Math.round((Date.parse(result.endedAt) - Date.parse(result.startedAt)) / 1000)
    : null;

  const { error: cErr } = await supabase.from("calls").insert({
    account_id: accountId,
    lead_id: leadId,
    vapi_call_id: callId,
    caller_id_used: (acct.vapi_phone_numbers as string[])?.[0] ?? null,
    outcome,
    duration_seconds: duration,
    cost: result.cost ?? null,
    transcript: result.transcript ?? null,
    recording_url: result.recordingUrl ?? null,
    started_at: result.startedAt ?? null,
    ended_at: result.endedAt ?? null,
  });
  if (cErr) throw new Error(`Saving call failed: ${cErr.message}`);

  const { error: uErr } = await supabase.from("leads").update(leadUpdate).eq("id", leadId);
  if (uErr) throw new Error(`Updating lead failed: ${uErr.message}`);

  return { callId, outcome, leadState: leadUpdate.state };
}
