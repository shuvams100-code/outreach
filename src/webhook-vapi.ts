import { supabase } from "./lib/supabase";
import { classifyCall, type RetryRules, type VapiResult } from "./outcome";
import { logCost } from "./costs";

// Handles VAPI's end-of-call webhook (POST /api/webhook/vapi).
// callContact places the call and exits immediately; this function runs when VAPI fires the result.
// Wire this to your webhook route in server.ts:
//   app.post("/api/webhook/vapi", async (req, res) => {
//     await processVapiCallEnd(req.body);
//     res.json({ ok: true });
//   });

const DEFAULT_RETRY: RetryRules = { max_attempts: 3, gap_days: 3 };

export async function processVapiCallEnd(body: any): Promise<void> {
  // VAPI end-of-call-report shape: { message: { type: "end-of-call-report", call: { ... } } }
  // or the call object may be at the top level depending on webhook version.
  const msg = body?.message ?? body ?? {};
  const call = msg.call ?? (msg.type === "end-of-call-report" ? msg : null) ?? {};

  const meta = call.metadata ?? {};
  const accountId = meta.account_id as string | undefined;
  const leadId = meta.lead_id as string | undefined;
  const callId = (call.id ?? msg.callId) as string | undefined;

  // Non-outbound calls (reminders, inbound) don't carry our lead metadata — skip silently.
  if (!accountId || !leadId || !callId) return;

  const result: VapiResult = {
    endedReason: call.endedReason,
    analysis: call.analysis,
  };

  // 4.9 NaN guard: Date.parse returns NaN on bad strings — avoid inserting NaN into the DB.
  const startMs = Date.parse(call.startedAt ?? "");
  const endMs = Date.parse(call.endedAt ?? "");
  const durationSeconds = !isNaN(startMs) && !isNaN(endMs)
    ? Math.round((endMs - startMs) / 1000)
    : null;

  const [{ data: acct }, { data: lead }] = await Promise.all([
    supabase.from("accounts").select("retry_rules, vapi_phone_numbers").eq("id", accountId).single(),
    supabase.from("leads").select("retry_count").eq("id", leadId).single(),
  ]);

  const rules = (acct?.retry_rules as RetryRules) ?? DEFAULT_RETRY;
  const { outcome, lead: leadUpdate } = classifyCall(
    result,
    lead?.retry_count ?? 0,
    rules,
    new Date(),
    durationSeconds,
  );

  await supabase.from("calls").insert({
    account_id: accountId,
    lead_id: leadId,
    vapi_call_id: callId,
    caller_id_used: (acct?.vapi_phone_numbers as string[])?.[0] ?? null,
    outcome,
    duration_seconds: durationSeconds,
    cost: call.cost ?? null,
    transcript: call.transcript ?? null,
    recording_url: call.recordingUrl ?? null,
    started_at: call.startedAt ?? null,
    ended_at: call.endedAt ?? null,
  });

  await supabase.from("leads").update(leadUpdate).eq("id", leadId);

  // 4.4 Deduct call cost from account balance (prevent dialing past zero balance).
  if (typeof call.cost === "number" && call.cost > 0) {
    await logCost(accountId, "vapi", call.cost, `Vapi call ${callId}`);
    await supabase.rpc("decrement_balance", { account_id: accountId, amount: call.cost });
  }
}
