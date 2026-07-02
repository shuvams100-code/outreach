import { supabase } from "./lib/supabase";

// 2026-07-02: cold outbound dialing removed entirely (TCPA — no consent basis for scraped/cold leads).
// What's left here is genuinely shared: loadCallAccount/buildCallOverrides back the inbound assistant
// setup scripts (setup-inbound.ts, create-test-assistant.ts), and placeCall/pollCall back the
// consent-gated reminder sweep (reminders.ts) — the one calling feature that survived, see design-log.md.

const VAPI_BASE = "https://api.vapi.ai";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type CallAccount = {
  vapi_phone_numbers: string[];
  vapi_assistant: Record<string, unknown> | null;
};

// Append extra system messages to an assistant for one call: the account's knowledge base (so the
// agent can answer questions about the client's business) and per-lead research (so it knows who it's
// calling). Returns undefined when there's nothing to add. Pure + unit-tested; any account's assistant.
export function buildCallOverrides(
  assistant: Record<string, any> | null,
  opts: { knowledgeBase?: string | null; businessName?: string | null; profile?: string | null; meetingInstruction?: string | null },
): Record<string, unknown> | undefined {
  const extra: { role: string; content: string }[] = [];
  if (opts.knowledgeBase?.trim()) {
    extra.push({
      role: "system",
      content: `ABOUT THE BUSINESS YOU REPRESENT (use this to answer questions accurately): ${opts.knowledgeBase.trim()}`,
    });
  }
  // Meeting mode: tells the agent whether to offer in-person, online, or ask. Keeps it from offering
  // a format the client doesn't do.
  if (opts.meetingInstruction?.trim()) {
    extra.push({ role: "system", content: `BOOKING — ${opts.meetingInstruction.trim()}` });
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

// Place one call. The assistant (script/voice/model) comes entirely from the
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
      // We NEVER leave a voicemail (it burns paid minutes talking to a machine). amd detects the
      // machine → endedReason "voicemail" → classified no_answer and retried later. The accounts
      // `leave_voicemail`/`voicemail_message` columns are intentionally UNUSED — do not wire them.
      // TODO(verify): confirm VAPI hangs up immediately on detection (api.vapi.ai/api#/Calls) so the
      // agent never speaks to the machine first.
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
