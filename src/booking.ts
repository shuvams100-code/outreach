import { supabase } from "./lib/supabase";
import { getBusy, computeFreeSlots, createEvent, deleteEvent, type GCreds, type MeetingFormat, type AvailabilityWindow } from "./calendar";

export type BookingConfig = {
  timezone: string;
  duration_minutes: number;
  buffer_minutes: number;
  day_start_hour: number;
  day_end_hour: number;
  horizon_days: number;
  meeting_link: string | null;
  meeting_mode?: MeetingFormat;     // in_person | online | both — how this client meets. Default derived below.
  address?: string | null;          // physical location, used for in-person meetings
  windows?: AvailabilityWindow[];   // optional format-scoped hours; falls back to day_start_hour/day_end_hour
};

// What format does this client meet in? Explicit setting wins; otherwise infer from what they gave us.
export function resolveMeetingMode(cfg: BookingConfig): MeetingFormat {
  if (cfg.meeting_mode) return cfg.meeting_mode;
  if (cfg.meeting_link && cfg.address) return "both";
  if (cfg.address) return "in_person";
  return "online";
}

// One line baked into the agent's prompt so it only ever offers what the client actually does.
export function meetingModeInstruction(cfg: BookingConfig): string {
  switch (resolveMeetingMode(cfg)) {
    case "in_person":
      return "Meetings are IN PERSON only. Never offer a video option — book the visit; the address goes in the confirmation.";
    case "online":
      return "Meetings are ONLINE (video) only. Never offer an in-person visit — book the video meeting; the join link goes in the confirmation.";
    default:
      return "This business offers BOTH in-person and online meetings. Before booking, ask the caller which they prefer — 'in person, or over video?' — and book that format.";
  }
}

async function loadBooking(accountId: string): Promise<{ cfg: BookingConfig; calendarId: string | null; business: string; credentials: GCreds | null }> {
  const { data, error } = await supabase
    .from("accounts")
    .select("booking, business_name, google_calendar_id, google_calendar_credentials")
    .eq("id", accountId)
    .single();
  if (error || !data) throw new Error(`Account ${accountId} not found: ${error?.message}`);
  // Our own DB is the source of truth (availability windows + bookings). Google is OPTIONAL: if the
  // account has a calendar id (or env fallback for tenant-0), we also mirror to it; if not, booking
  // still works entirely off our own calendar.
  const calendarId = (data.google_calendar_id as string | null) ?? process.env.GOOGLE_CALENDAR_ID ?? null;
  return {
    cfg: data.booking as BookingConfig,
    calendarId,
    business: data.business_name ?? "the team",
    credentials: (data.google_calendar_credentials as GCreds | null) ?? null,
  };
}

export type Slot = { startIso: string; label: string };

// Human label for a slot in the booking timezone, e.g. "Thu, Jul 2, 3:30 PM EDT".
function labelSlot(startIso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(startIso));
}

// Open meeting slots for an account, ready to read aloud to a caller. `format` (when the client offers
// both) narrows to windows that serve that format; busy times always block both formats.
export async function getAvailableSlots(accountId: string, format: MeetingFormat = "both", now: Date = new Date(), max = 4): Promise<Slot[]> {
  const { cfg, calendarId, credentials } = await loadBooking(accountId);
  const horizonEnd = new Date(now.getTime() + cfg.horizon_days * 86_400_000);
  // Google busy is only consulted if the client opted into calendar sync; otherwise our DB stands alone.
  const calendarBusy = calendarId ? await getBusy(calendarId, now, horizonEnd, credentials) : [];

  // Our own bookings are the source of truth. EVERY open booking blocks the slot, regardless of its
  // format — one person can't be in two meetings at once.
  const { data: dbBookings } = await supabase
    .from("bookings")
    .select("meeting_at")
    .eq("account_id", accountId)
    .eq("status", "open")
    .gte("meeting_at", now.toISOString())
    .lte("meeting_at", horizonEnd.toISOString());
  const dbBusy = (dbBookings ?? [])
    .filter((b) => b.meeting_at)
    .map((b) => ({ start: b.meeting_at as string, end: new Date(Date.parse(b.meeting_at as string) + cfg.duration_minutes * 60_000).toISOString() }));

  const starts = computeFreeSlots([...calendarBusy, ...dbBusy], {
    from: now,
    horizonDays: cfg.horizon_days,
    tz: cfg.timezone,
    dayStartHour: cfg.day_start_hour,
    dayEndHour: cfg.day_end_hour,
    windows: cfg.windows,
    durationMin: cfg.duration_minutes,
    bufferMin: cfg.buffer_minutes,
    maxSlots: max,
    format,
  });
  return starts.map((s) => ({ startIso: s, label: labelSlot(s, cfg.timezone) }));
}

// Book a specific slot. Returns the confirmation the agent reads back, plus the format-resolved
// link/address so the email can carry the right detail. Google sync is best-effort, never required.
export async function bookSlot(
  accountId: string,
  startIso: string,
  who: { name?: string | null; company?: string | null; phone?: string | null; notes?: string | null; email?: string | null },
  format?: MeetingFormat,
): Promise<{ label: string; format: MeetingFormat; meetingLink: string | null; address: string | null; eventId: string | null; durationMin: number }> {
  const { cfg, calendarId, business, credentials } = await loadBooking(accountId);
  // Resolve the concrete format for THIS booking. If the caller didn't choose (and the client does
  // both), default to online so a link goes out rather than nothing.
  let fmt = format ?? resolveMeetingMode(cfg);
  if (fmt === "both") fmt = "online";
  const meetingLink = fmt === "online" ? (cfg.meeting_link ?? null) : null;
  const address = fmt === "in_person" ? (cfg.address ?? null) : null;

  // Mirror to Google only if the client connected a calendar. Failure here must not break the booking —
  // our DB is the source of truth.
  let eventId: string | null = null;
  if (calendarId) {
    const guest = who.name || who.company || who.phone || "prospect";
    try {
      const ev = await createEvent(calendarId, {
        summary: `${business} ↔ ${guest}`,
        description: [who.company && `Company: ${who.company}`, who.phone && `Phone: ${who.phone}`, who.notes && `Notes: ${who.notes}`, address && `Where: ${address}`]
          .filter(Boolean)
          .join("\n"),
        startIso,
        durationMin: cfg.duration_minutes,
        timezone: cfg.timezone,
        meetingLink,
        guestEmail: who.email ?? null,
      }, credentials);
      eventId = ev.id;
    } catch (e: any) {
      console.error("[booking] Google sync failed (booking still saved):", e?.message ?? e);
    }
  }
  return { label: labelSlot(startIso, cfg.timezone), format: fmt, meetingLink, address, eventId, durationMin: cfg.duration_minutes };
}

// Cancel a booking — delete its calendar event (if synced) and close the DB row (frees capacity).
// Used when a meeting is rescheduled, so the old one doesn't ghost on the calendar or eat capacity.
export async function cancelBooking(accountId: string, bookingId: string): Promise<void> {
  const { data: bk } = await supabase
    .from("bookings").select("google_event_id").eq("id", bookingId).eq("account_id", accountId).maybeSingle();
  if (!bk) return;
  if (bk.google_event_id) {
    const { calendarId, credentials } = await loadBooking(accountId);
    if (calendarId) {
      try { await deleteEvent(calendarId, bk.google_event_id as string, credentials); }
      catch (e: any) { console.error("[booking] deleteEvent failed:", e?.message ?? e); }
    }
  }
  await supabase.from("bookings").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", bookingId);
}
