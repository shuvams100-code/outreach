import { supabase } from "./lib/supabase";
import { getAvailableSlots, bookSlot } from "./booking";
import { notifyBookingCreated } from "./notify";

// The two tools VAPI calls mid-conversation so the agent can book against the real calendar.
// HTTP lives in server.ts; the logic here is plain and unit-testable.

export type ToolCall = { id: string; name: string; args: Record<string, any> };
export type CallContext = { accountId: string; leadId: string | null; vapiCallId: string | null };
export type ParsedCall = {
  calls: ToolCall[];
  accountIdHint: string | null;  // outbound: we stamp account_id into call.metadata
  leadId: string | null;
  vapiCallId: string | null;
  phoneNumberId: string | null;  // inbound: the dialed VAPI number → maps to its owning account
};

// ---- pure: parse VAPI's webhook + build its expected reply (no network, unit-tested) ----

// VAPI nests tool calls under message.toolCallList (or .toolCalls); each has function.{name,arguments}.
// `arguments` arrives as an object or a JSON string depending on model/version — handle both.
export function parseToolCalls(body: any): ParsedCall {
  const msg = body?.message ?? {};
  const list = msg.toolCallList ?? msg.toolCalls ?? [];
  const calls: ToolCall[] = (Array.isArray(list) ? list : []).map((t: any) => {
    const fn = t.function ?? t;
    let args = fn.arguments ?? {};
    if (typeof args === "string") { try { args = JSON.parse(args); } catch { args = {}; } }
    return { id: t.id ?? fn.id ?? "", name: fn.name ?? "", args: args ?? {} };
  });
  const meta = msg.call?.metadata ?? msg.call?.assistantOverrides?.metadata ?? {};
  return {
    calls,
    accountIdHint: meta.account_id ?? null,
    leadId: meta.lead_id ?? null,
    vapiCallId: msg.call?.id ?? null,
    phoneNumberId: msg.call?.phoneNumberId ?? msg.phoneNumber?.id ?? msg.call?.phoneNumber?.id ?? null,
  };
}

// Decide which account this call books for. Order:
//   1. explicit metadata.account_id  — set by us when we place an OUTBOUND call
//   2. owner of the dialed number     — for INBOUND, look up which account owns that VAPI number
//   3. DEFAULT_ACCOUNT_ID env var      — opt-in, for local/web testing only
// No hardcoded production fallback: if none match we return null and refuse to book, so a call
// can never silently land on the wrong account's calendar.
export async function resolveAccountId(p: { accountIdHint: string | null; phoneNumberId: string | null }): Promise<string | null> {
  if (p.accountIdHint) return p.accountIdHint;
  if (p.phoneNumberId) {
    const { data } = await supabase
      .from("accounts")
      .select("id")
      .contains("vapi_phone_numbers", [p.phoneNumberId])
      .limit(1)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  return process.env.DEFAULT_ACCOUNT_ID ?? null;
}

// VAPI expects { results: [{ toolCallId, result }] } — `result` is the string the model reads back.
export function toolResponse(results: { toolCallId: string; result: string }[]) {
  return { results };
}

// ---- handlers (touch calendar + DB) ----

export async function handleCheckAvailability(accountId: string): Promise<string> {
  const slots = await getAvailableSlots(accountId, new Date(), 4);
  if (!slots.length) return "No open slots in the next two weeks. Offer to follow up by email instead.";
  const lines = slots.map((s, i) => `${i + 1}. ${s.label}  [start=${s.startIso}]`);
  return (
    "Open meeting slots. Read the friendly time to the prospect; to book, call book_appointment " +
    "with the exact start value shown in brackets:\n" + lines.join("\n")
  );
}

export async function handleBookAppointment(args: any, ctx: CallContext): Promise<string> {
  const rawStart = args?.start;
  if (!rawStart) return "Missing the slot start. Call check_availability first, then book with the exact start value.";

  // Re-validate against current availability (match by instant, tolerant of ISO format drift).
  const open = await getAvailableSlots(ctx.accountId, new Date(), 12);
  const slot = open.find((s) => Date.parse(s.startIso) === Date.parse(rawStart));
  if (!slot) {
    const alt = open.slice(0, 3).map((s) => s.label).join("; ");
    return `That time is no longer open. Offer one of these instead: ${alt || "(none available)"}`;
  }

  const who = { name: args.name ?? null, company: args.company ?? null, phone: args.phone ?? null };
  const r = await bookSlot(ctx.accountId, slot.startIso, who);

  // Record so the rest of the system sees it (capacity throttle, reminders, dashboards).
  // ponytail: call_id stays null — the live call's `calls` row doesn't exist until the call ends.
  const { error } = await supabase.from("bookings").insert({
    account_id: ctx.accountId,
    lead_id: ctx.leadId,
    meeting_at: slot.startIso,
    meeting_type: "google_meet",
    meeting_link: r.meetingLink,
    google_event_id: r.eventId,
    status: "open",
  });
  if (error) return `Calendar booked (${r.label}) but saving it failed: ${error.message}. Tell the prospect it's set; flag for support.`;
  if (ctx.leadId) await supabase.from("leads").update({ state: "booked" }).eq("id", ctx.leadId);

  // Fire the booking alert (Slack + client email). Never let a notification failure break the booking.
  const prospect = who.name || who.company || who.phone || "prospect";
  try { await notifyBookingCreated(ctx.accountId, prospect, r.label, r.meetingLink); }
  catch (e: any) { console.error("[tools] booking notification failed:", e?.message ?? e); }

  return `Booked for ${r.label}. Confirm the day and time with the prospect and let them know the invite + link is on the way.`;
}

// ---- dispatcher (server.ts calls this) ----

export async function handleToolCalls(body: any): Promise<{ results: { toolCallId: string; result: string }[] }> {
  const p = parseToolCalls(body);
  const accountId = await resolveAccountId(p);
  const ctx: CallContext = { accountId: accountId ?? "", leadId: p.leadId, vapiCallId: p.vapiCallId };
  const results = [];
  for (const c of p.calls) {
    let result: string;
    try {
      if (!accountId) result = "Could not identify which account this call is for — cannot check availability or book. Apologize and flag for support.";
      else if (c.name === "check_availability") result = await handleCheckAvailability(accountId);
      else if (c.name === "book_appointment") result = await handleBookAppointment(c.args, ctx);
      else result = `Unknown tool: ${c.name}`;
    } catch (e: any) {
      result = `Tool error: ${e?.message ?? e}`;
    }
    results.push({ toolCallId: c.id, result });
  }
  return toolResponse(results);
}
