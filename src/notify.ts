import { supabase } from "./lib/supabase";

// One lightweight internal alert when a meeting books. Slack only.
// ponytail: SLACK_WEBHOOK_URL optional — missing = log + skip, never throw.

async function slackTo(url: string | null | undefined, text: string): Promise<boolean> {
  if (!url) { console.log("[notify] no Slack webhook configured — skipping:", text); return false; }
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

// ponytail: kept for scripts/tests that call slack() directly.
export async function slack(text: string): Promise<boolean> {
  return slackTo(process.env.SLACK_WEBHOOK_URL, text);
}

// pure template (unit-tested)
export function bookingSlackText(businessName: string, prospect: string, whenLabel: string, meetingLink: string | null): string {
  return `📅 New meeting booked${businessName ? ` for *${businessName}*` : ""}\n• With: ${prospect}\n• When: ${whenLabel}` +
    (meetingLink ? `\n• Link: ${meetingLink}` : "");
}

// Fired when a meeting books. Uses the account's own Slack webhook, falls back to the master env var
// so a single-tenant setup still works without per-account configuration.
export async function notifyBookingCreated(accountId: string, prospect: string, whenLabel: string, meetingLink: string | null): Promise<void> {
  const { data } = await supabase.from("accounts").select("business_name, slack_webhook_url").eq("id", accountId).single();
  const url = (data?.slack_webhook_url as string | null) ?? process.env.SLACK_WEBHOOK_URL;
  await slackTo(url, bookingSlackText(data?.business_name ?? "", prospect, whenLabel, meetingLink));
}

// Fired when a calendar API call returns 401 — the client's integration has expired.
export async function notifyCalendarDisconnected(accountId: string): Promise<void> {
  const { data } = await supabase.from("accounts").select("business_name, slack_webhook_url").eq("id", accountId).single();
  const url = (data?.slack_webhook_url as string | null) ?? process.env.SLACK_WEBHOOK_URL;
  const name = data?.business_name ? ` for *${data.business_name}*` : "";
  await slackTo(url, `⚠️ Calendar disconnected${name} — the Google OAuth token has expired. Please re-authenticate at your dashboard to resume booking.`);
}
