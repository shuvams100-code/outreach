import { supabase } from "./lib/supabase";

// One lightweight internal alert when a meeting books. Slack only — Google Calendar already
// reminds the host before the meeting, and the prospect gets a reminder call (later), so we
// deliberately do NOT send our own emails (no Resend, no domain setup to babysit).
// ponytail: SLACK_WEBHOOK_URL optional — missing = log + skip, never throw.

export async function slack(text: string): Promise<boolean> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) { console.log("[notify] SLACK_WEBHOOK_URL not set — skipping Slack:", text); return false; }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) { console.error("[notify] Slack failed:", res.status, await res.text()); return false; }
    return true;
  } catch (e: any) { console.error("[notify] Slack error:", e?.message ?? e); return false; }
}

// pure template (unit-tested)
export function bookingSlackText(businessName: string, prospect: string, whenLabel: string, meetingLink: string | null): string {
  return `📅 New meeting booked${businessName ? ` for *${businessName}*` : ""}\n• With: ${prospect}\n• When: ${whenLabel}` +
    (meetingLink ? `\n• Link: ${meetingLink}` : "");
}

// Fired when a meeting books (called from the booking tool).
export async function notifyBookingCreated(accountId: string, prospect: string, whenLabel: string, meetingLink: string | null): Promise<void> {
  const { data } = await supabase.from("accounts").select("business_name").eq("id", accountId).single();
  await slack(bookingSlackText(data?.business_name ?? "", prospect, whenLabel, meetingLink));
}
