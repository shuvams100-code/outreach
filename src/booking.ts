import { supabase } from "./lib/supabase";
import { getBusy, computeFreeSlots, createEvent, deleteEvent, type GCreds } from "./calendar";

export type BookingConfig = {
  timezone: string;
  duration_minutes: number;
  buffer_minutes: number;
  day_start_hour: number;
  day_end_hour: number;
  horizon_days: number;
  meeting_link: string | null;
};

async function loadBooking(accountId: string): Promise<{ cfg: BookingConfig; calendarId: string; business: string; credentials: GCreds | null }> {
  const { data, error } = await supabase
    .from("accounts")
    .select("booking, business_name, google_calendar_id, google_calendar_credentials")
    .eq("id", accountId)
    .single();
  if (error || !data) throw new Error(`Account ${accountId} not found: ${error?.message}`);
  // Per-account calendar + creds (true multi-tenancy); fall back to env for tenant-0 / local dev only.
  const calendarId = (data.google_calendar_id as string | null) ?? process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error(`Account ${accountId} has no google_calendar_id and GOOGLE_CALENDAR_ID is unset`);
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

// Open meeting slots for an account, ready to read aloud to a caller.
export async function getAvailableSlots(accountId: string, now: Date = new Date(), max = 4): Promise<Slot[]> {
  const { cfg, calendarId, credentials } = await loadBooking(accountId);
  const horizonEnd = new Date(now.getTime() + cfg.horizon_days * 86_400_000);
  const calendarBusy = await getBusy(calendarId, now, horizonEnd, credentials);

  // Also block slots we've already booked in our DB but that may not have synced to the calendar yet
  // (avoids a double-booking when two calls race or the calendar API lags).
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
    durationMin: cfg.duration_minutes,
    bufferMin: cfg.buffer_minutes,
    maxSlots: max,
  });
  return starts.map((s) => ({ startIso: s, label: labelSlot(s, cfg.timezone) }));
}

// Book a specific slot. Returns the confirmation the agent reads back.
export async function bookSlot(
  accountId: string,
  startIso: string,
  who: { name?: string | null; company?: string | null; phone?: string | null; notes?: string | null; email?: string | null },
): Promise<{ label: string; meetingLink: string | null; eventId: string | null }> {
  const { cfg, calendarId, business, credentials } = await loadBooking(accountId);
  const guest = who.name || who.company || who.phone || "prospect";
  const ev = await createEvent(calendarId, {
    summary: `${business} ↔ ${guest}`,
    description: [who.company && `Company: ${who.company}`, who.phone && `Phone: ${who.phone}`, who.notes && `Notes: ${who.notes}`]
      .filter(Boolean)
      .join("\n"),
    startIso,
    durationMin: cfg.duration_minutes,
    timezone: cfg.timezone,
    meetingLink: cfg.meeting_link,
    guestEmail: who.email ?? null,
  }, credentials);
  return { label: labelSlot(startIso, cfg.timezone), meetingLink: ev.meetingLink, eventId: ev.id };
}

// Cancel a booking — delete its calendar event and close the DB row (frees the capacity slot).
// Used when a meeting is rescheduled, so the old one doesn't ghost on the calendar or eat capacity.
export async function cancelBooking(accountId: string, bookingId: string): Promise<void> {
  const { data: bk } = await supabase
    .from("bookings").select("google_event_id").eq("id", bookingId).eq("account_id", accountId).maybeSingle();
  if (!bk) return;
  if (bk.google_event_id) {
    const { calendarId, credentials } = await loadBooking(accountId);
    try { await deleteEvent(calendarId, bk.google_event_id as string, credentials); }
    catch (e: any) { console.error("[booking] deleteEvent failed:", e?.message ?? e); }
  }
  await supabase.from("bookings").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", bookingId);
}
