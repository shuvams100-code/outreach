import { supabase } from "./lib/supabase";
import type { MeetingFormat } from "./calendar";

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

// ---- email + .ics booking confirmations (no per-client calendar integration needed) ----

// pure: escape a value for an .ics text field (RFC 5545 §3.3.11).
function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// pure: ISO instant → iCal UTC stamp, e.g. "2026-07-02T19:30:00.000Z" → "20260702T193000Z".
function icsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// pure (unit-tested): build an .ics calendar invite. Attached to the email as an optional convenience —
// the email body already carries the join link/address, so this is for people who want it auto-added.
export type IcsInput = {
  uid: string;
  startIso: string;
  durationMin: number;
  summary: string;
  description?: string;
  location?: string | null; // a join URL or a physical address; calendar apps render either
  stampIso?: string;        // DTSTAMP; defaults to now (pass a fixed value in tests)
};
export function buildIcs(o: IcsInput): string {
  const endIso = new Date(Date.parse(o.startIso) + o.durationMin * 60_000).toISOString();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reacher AI//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${o.uid}`,
    `DTSTAMP:${icsStamp(o.stampIso ?? new Date().toISOString())}`,
    `DTSTART:${icsStamp(o.startIso)}`,
    `DTEND:${icsStamp(endIso)}`,
    `SUMMARY:${icsEscape(o.summary)}`,
    ...(o.description ? [`DESCRIPTION:${icsEscape(o.description)}`] : []),
    ...(o.location ? [`LOCATION:${icsEscape(o.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export type BookingEmailInput = {
  businessName: string;
  meetingLabel: string;     // human time, e.g. "Thu, Jul 2, 3:30 PM EDT"
  format: MeetingFormat;
  meetingLink: string | null;
  address: string | null;
  customerName: string | null;
};

// pure (unit-tested): the confirmation email for one recipient. `role` tweaks the greeting; the
// where-to-go detail (Join button or address) is identical and always in the body — never .ics-only.
export function bookingEmail(role: "client" | "customer", o: BookingEmailInput): { subject: string; html: string; text: string } {
  const who = o.customerName || "your guest";
  const isOnline = o.format === "online";
  const whereLabelText = isOnline
    ? (o.meetingLink ? `Join link: ${o.meetingLink}` : "Join link: (to be shared)")
    : (o.address ? `Where: ${o.address}` : "Where: (to be shared)");
  const whereHtml = isOnline
    ? (o.meetingLink
        ? `<a href="${o.meetingLink}" style="display:inline-block;background:#4F46FF;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600">Join the meeting</a>`
        : `<p style="color:#8A90A0">A join link will be shared shortly.</p>`)
    : (o.address
        ? `<p><strong>Where:</strong> ${o.address} &middot; <a href="https://maps.google.com/?q=${encodeURIComponent(o.address)}">Open in Maps</a></p>`
        : `<p style="color:#8A90A0">The address will be shared shortly.</p>`);

  const subject = role === "client"
    ? `New meeting booked — ${who}, ${o.meetingLabel}`
    : `Your meeting with ${o.businessName} is confirmed — ${o.meetingLabel}`;

  const intro = role === "client"
    ? `A new meeting has been booked with <strong>${who}</strong>.`
    : `Your meeting with <strong>${o.businessName}</strong> is confirmed.`;

  const html = [
    `<div style="font-family:system-ui,Arial,sans-serif;color:#1F2433;max-width:520px">`,
    `<p>${intro}</p>`,
    `<p><strong>When:</strong> ${o.meetingLabel}</p>`,
    `<p><strong>Format:</strong> ${isOnline ? "Online (video)" : "In person"}</p>`,
    whereHtml,
    `<p style="color:#8A90A0;font-size:12px;margin-top:24px">A calendar invite is attached.</p>`,
    `</div>`,
  ].join("");

  const text = [
    role === "client" ? `New meeting booked with ${who}.` : `Your meeting with ${o.businessName} is confirmed.`,
    `When: ${o.meetingLabel}`,
    `Format: ${isOnline ? "Online (video)" : "In person"}`,
    whereLabelText,
    "",
    "A calendar invite is attached.",
  ].join("\n");

  return { subject, html, text };
}

// Send one email via Resend. Graceful: no RESEND_API_KEY → log + skip (mirrors the Slack helper).
async function sendEmail(to: string, subject: string, html: string, text: string, ics?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.log("[notify] no RESEND_API_KEY — skipping email to", to); return false; }
  const from = process.env.EMAIL_FROM ?? "Reacher AI <bookings@reacher.ai>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to, subject, html, text,
        ...(ics ? { attachments: [{ filename: "invite.ics", content: Buffer.from(ics).toString("base64") }] } : {}),
      }),
    });
    if (!res.ok) { console.error("[notify] Resend failed:", res.status, await res.text()); return false; }
    return true;
  } catch (e: any) { console.error("[notify] Resend error:", e?.message ?? e); return false; }
}

// Fired when a meeting books: emails BOTH the client (business) and the customer, each with an .ics.
// Customer email may be missing (esp. inbound) — then we email the client only.
export async function notifyBookingEmails(accountId: string, o: {
  startIso: string;
  meetingLabel: string;
  durationMin: number;
  format: MeetingFormat;
  meetingLink: string | null;
  address: string | null;
  customerName: string | null;
  customerEmail: string | null;
}): Promise<void> {
  const { data } = await supabase.from("accounts").select("business_name, contact_email").eq("id", accountId).single();
  const businessName = (data?.business_name as string | null) ?? "the team";
  const clientEmail = data?.contact_email as string | null;

  const input: BookingEmailInput = {
    businessName, meetingLabel: o.meetingLabel, format: o.format,
    meetingLink: o.meetingLink, address: o.address, customerName: o.customerName,
  };
  const ics = buildIcs({
    uid: `${accountId}-${Date.parse(o.startIso)}@reacher.ai`,
    startIso: o.startIso,
    durationMin: o.durationMin,
    summary: o.customerName ? `${businessName} ↔ ${o.customerName}` : `Meeting with ${businessName}`,
    description: o.format === "online" ? (o.meetingLink ? `Join: ${o.meetingLink}` : undefined) : undefined,
    location: o.format === "online" ? o.meetingLink : o.address,
  });

  if (clientEmail) {
    const e = bookingEmail("client", input);
    await sendEmail(clientEmail, e.subject, e.html, e.text, ics);
  }
  if (o.customerEmail) {
    const e = bookingEmail("customer", input);
    await sendEmail(o.customerEmail, e.subject, e.html, e.text, ics);
  }
}
