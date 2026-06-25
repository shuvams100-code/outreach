import { supabase } from "./lib/supabase";
import { getBusy, computeFreeSlots, createEvent } from "./calendar";

export type BookingConfig = {
  timezone: string;
  duration_minutes: number;
  buffer_minutes: number;
  day_start_hour: number;
  day_end_hour: number;
  horizon_days: number;
  meeting_link: string | null;
};

async function loadBooking(accountId: string): Promise<{ cfg: BookingConfig; calendarId: string; business: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("Missing GOOGLE_CALENDAR_ID in .env");
  const { data, error } = await supabase
    .from("accounts")
    .select("booking, business_name")
    .eq("id", accountId)
    .single();
  if (error || !data) throw new Error(`Account ${accountId} not found: ${error?.message}`);
  return { cfg: data.booking as BookingConfig, calendarId, business: data.business_name ?? "the team" };
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
  const { cfg, calendarId } = await loadBooking(accountId);
  const horizonEnd = new Date(now.getTime() + cfg.horizon_days * 86_400_000);
  const busy = await getBusy(calendarId, now, horizonEnd);
  const starts = computeFreeSlots(busy, {
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
  who: { name?: string | null; company?: string | null; phone?: string | null },
): Promise<{ label: string; meetingLink: string | null; eventId: string | null }> {
  const { cfg, calendarId, business } = await loadBooking(accountId);
  const guest = who.name || who.company || who.phone || "prospect";
  const ev = await createEvent(calendarId, {
    summary: `${business} ↔ ${guest}`,
    description: [who.company && `Company: ${who.company}`, who.phone && `Phone: ${who.phone}`]
      .filter(Boolean)
      .join("\n"),
    startIso,
    durationMin: cfg.duration_minutes,
    timezone: cfg.timezone,
    meetingLink: cfg.meeting_link,
  });
  return { label: labelSlot(startIso, cfg.timezone), meetingLink: ev.meetingLink, eventId: ev.id };
}
