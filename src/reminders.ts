import { supabase } from "./lib/supabase";
import { placeCall, type CallAccount } from "./call";

// Reminder-call sweep: ~1h before a booked meeting, call the prospect to confirm.
// Runs across ALL accounts in one pass (one cron job covers every tenant).
// ponytail: the confirm/reschedule conversation is driven by the assistant + the existing booking
// tools, not by this sweep — the sweep only decides who to call and records that it called.

export type DueBooking = {
  id: string;
  account_id: string;
  lead_id: string | null;
  meeting_at: string | null;
  reminder_1h_sent_at: string | null;
  status: string;
};

// PURE (unit-tested): which open bookings are due for their reminder right now?
// Due = open, has a meeting time in the future but within the window, not already reminded.
export function selectDueReminders(bookings: DueBooking[], now: Date, windowMs = 3_600_000): DueBooking[] {
  const t = now.getTime();
  return bookings.filter((b) => {
    if (b.status !== "open" || b.reminder_1h_sent_at || !b.meeting_at) return false;
    const m = Date.parse(b.meeting_at);
    return m > t && m <= t + windowMs;
  });
}

// PURE (unit-tested): the line the agent opens the reminder call with.
export function reminderFirstMessage(whenLabel: string): string {
  return `Hi, this is Alex from Reacher A.I. — a quick reminder about your meeting coming up at ${whenLabel}. Will you be able to make it?`;
}

function labelMeeting(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(iso));
}

// Orchestrator: find due reminders, place a reminder call for each, stamp it sent.
// Run on a schedule (every ~15 min) — wired to Vercel Cron at deploy; run once via `npm run reminders`.
export async function runReminderSweep(now: Date = new Date()): Promise<{ placed: number; skipped: number }> {
  const horizon = new Date(now.getTime() + 3_600_000).toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, account_id, lead_id, meeting_at, reminder_1h_sent_at, status")
    .eq("status", "open")
    .is("reminder_1h_sent_at", null)
    .gte("meeting_at", now.toISOString())
    .lte("meeting_at", horizon);
  if (error) throw new Error(`Loading bookings failed: ${error.message}`);

  const due = selectDueReminders((data ?? []) as DueBooking[], now);
  let placed = 0, skipped = 0;

  for (const b of due) {
    // No lead = no prospect number to call (e.g. an inbound booking with no captured lead). Skip.
    if (!b.lead_id) { skipped++; continue; }
    const { data: lead } = await supabase.from("leads").select("phone, first_name").eq("id", b.lead_id).single();
    if (!lead?.phone) { skipped++; continue; }
    const { data: acct } = await supabase
      .from("accounts").select("vapi_phone_numbers, vapi_assistant, booking").eq("id", b.account_id).single();
    if (!acct?.vapi_assistant) { skipped++; continue; }

    const tz = (acct.booking as any)?.timezone ?? "America/New_York";
    const whenLabel = labelMeeting(b.meeting_at!, tz);
    try {
      await placeCall(
        acct as CallAccount,
        lead.phone,
        lead.first_name ?? undefined,
        { account_id: b.account_id, lead_id: b.lead_id, purpose: "reminder", booking_id: b.id },
        { firstMessage: reminderFirstMessage(whenLabel) },
      );
      await supabase.from("bookings").update({ reminder_1h_sent_at: now.toISOString() }).eq("id", b.id);
      placed++;
    } catch (e: any) {
      console.error(`[reminders] booking ${b.id} call failed:`, e?.message ?? e);
      skipped++;
    }
  }
  return { placed, skipped };
}
