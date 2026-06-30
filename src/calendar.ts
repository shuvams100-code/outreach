import { readFileSync } from "node:fs";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// Service-account credentials. Per-account creds (from accounts.google_calendar_credentials) keep tenants
// isolated; falls back to the env key file for tenant-0 / local dev. NEVER share one calendar across clients.
export type ServiceAccountCreds = { client_email: string; private_key: string };
// OAuth credentials — required for consumer Gmail accounts (service accounts can't invite external guests).
export type OAuthCreds = { client_id: string; client_secret: string; refresh_token: string };
export type GCreds = ServiceAccountCreds | OAuthCreds;

function isOAuth(c: GCreds): c is OAuthCreds {
  return "refresh_token" in c;
}

function getCalendar(credentials?: GCreds | null) {
  let creds = credentials;
  if (!creds) {
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!keyPath) throw new Error("No calendar credentials: account has none and GOOGLE_SERVICE_ACCOUNT_KEY is unset");
    creds = JSON.parse(readFileSync(keyPath, "utf8")) as GCreds;
  }
  let auth;
  if (isOAuth(creds)) {
    // OAuth: client's personal Google account — can invite external guests, required for consumer Gmail.
    const oauth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
    oauth.setCredentials({ refresh_token: creds.refresh_token });
    auth = oauth;
  } else {
    auth = new google.auth.JWT({ email: creds.client_email, key: creds.private_key, scopes: SCOPES });
  }
  return google.calendar({ version: "v3", auth });
}

export type BusyBlock = { start: string; end: string };

export async function getBusy(calendarId: string, timeMin: Date, timeMax: Date, credentials?: GCreds | null): Promise<BusyBlock[]> {
  try {
    const cal = getCalendar(credentials);
    const res = await cal.freebusy.query({
      requestBody: { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(), items: [{ id: calendarId }] },
    });
    return (res.data.calendars?.[calendarId]?.busy ?? []).map((b) => ({ start: b.start!, end: b.end! }));
  } catch (e: any) {
    console.error("[calendar] getBusy failed:", e?.message ?? e);
    return []; // degrade gracefully — availability check continues without calendar data
  }
}

// ---------- pure timezone-aware slot math (unit-tested) ----------

// Offset (ms) of a timezone from UTC at a given instant. Positive = ahead of UTC.
export function tzOffsetMs(instant: Date, tz: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? "0");
  let hour = get("hour");
  if (hour === 24) hour = 0; // some environments render midnight as 24
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return asUtc - instant.getTime();
}

// A wall-clock time in `tz` → the matching UTC instant. DST-correct (re-checks offset after the shift).
export function wallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const utc1 = new Date(guess.getTime() - tzOffsetMs(guess, tz));
  return new Date(guess.getTime() - tzOffsetMs(utc1, tz));
}

function partsInTz(instant: Date, tz: string) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).formatToParts(instant);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { year: +get("year"), month: +get("month"), day: +get("day"), weekday: get("weekday") };
}

// A meeting can be in-person, online, or the account offers both. Availability windows can be scoped to
// a format ("mornings in-person, afternoons online"); a slot request asks for one concrete format.
export type MeetingFormat = "in_person" | "online" | "both";

// One block of bookable hours. `days` = 0(Sun)..6(Sat), default Mon–Fri. `format` = which meeting
// format this window serves, default "both".
export type AvailabilityWindow = {
  dayStartHour: number;
  dayEndHour: number;
  days?: number[];
  format?: MeetingFormat;
};

export type SlotOpts = {
  from: Date;
  horizonDays: number;   // how many days ahead to search
  tz: string;            // timezone the working hours are expressed in
  dayStartHour?: number; // back-compat single window start (e.g. 9)
  dayEndHour?: number;   // back-compat single window end (e.g. 17)
  windows?: AvailabilityWindow[]; // if set, overrides dayStartHour/dayEndHour
  durationMin: number;   // meeting length
  bufferMin: number;     // gap between meetings
  maxSlots: number;      // stop after this many
  format?: MeetingFormat; // requested format; default "both" = no format filtering
};

const WEEKDAY_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Does a window offering format `w` satisfy a request for format `requested`?
// A "both" window serves any request; a "both" request accepts any window.
function windowServes(w: MeetingFormat, requested: MeetingFormat): boolean {
  return requested === "both" || w === "both" || w === requested;
}

// Open meeting slots: inside the availability windows (in `tz`), not overlapping a busy block, in the
// future, and — if a format is requested — only from windows that serve that format. Busy blocks are
// NEVER filtered by format: one person can't take an online and an in-person meeting at the same time,
// so any booking blocks the slot for both. Returns ISO start times (UTC), chronological, deduped.
export function computeFreeSlots(busy: BusyBlock[], o: SlotOpts): string[] {
  const busyR = busy.map((b) => [Date.parse(b.start), Date.parse(b.end)] as const);
  const step = o.durationMin + o.bufferMin;
  const requested = o.format ?? "both";
  const windows: AvailabilityWindow[] = (o.windows && o.windows.length)
    ? o.windows
    : [{ dayStartHour: o.dayStartHour ?? 9, dayEndHour: o.dayEndHour ?? 17, days: [1, 2, 3, 4, 5], format: "both" }];
  const out: string[] = [];

  for (let d = 0; d < o.horizonDays; d++) {
    const { year, month, day, weekday } = partsInTz(new Date(o.from.getTime() + d * 86_400_000), o.tz);
    const dow = WEEKDAY_NUM[weekday] ?? -1;
    for (const w of windows) {
      const days = w.days ?? [1, 2, 3, 4, 5];
      if (!days.includes(dow)) continue;
      if (!windowServes(w.format ?? "both", requested)) continue;
      for (let min = w.dayStartHour * 60; min + o.durationMin <= w.dayEndHour * 60; min += step) {
        const start = wallTimeToUtc(year, month, day, Math.floor(min / 60), min % 60, o.tz);
        if (start.getTime() <= o.from.getTime()) continue; // future only
        const end = new Date(start.getTime() + o.durationMin * 60_000);
        const clash = busyR.some(([bs, be]) => start.getTime() < be && end.getTime() > bs);
        if (!clash) out.push(start.toISOString());
      }
    }
  }
  // Windows can overlap or be listed out of order → dedupe and sort (UTC ISO sorts chronologically).
  return [...new Set(out)].sort().slice(0, o.maxSlots);
}

// ---------- write an event ----------
export async function createEvent(
  calendarId: string,
  e: {
    summary: string;
    description?: string;
    startIso: string;
    durationMin: number;
    timezone: string;
    meetingLink?: string | null;
    guestEmail?: string | null;   // added: sends a calendar invite to the prospect
  },
  credentials?: GCreds | null,
): Promise<{ id: string | null; htmlLink: string | null; meetingLink: string | null }> {
  const cal = getCalendar(credentials);
  const start = new Date(e.startIso);
  const end = new Date(start.getTime() + e.durationMin * 60_000);
  const description = e.meetingLink
    ? `${e.description ?? ""}\n\nJoin: ${e.meetingLink}`.trim()
    : e.description;
  const res = await cal.events.insert({
    calendarId,
    // sendUpdates: "all" emails the prospect their calendar invite when guestEmail is provided.
    sendUpdates: e.guestEmail ? "all" : "none",
    requestBody: {
      summary: e.summary,
      description,
      location: e.meetingLink ?? undefined,
      start: { dateTime: start.toISOString(), timeZone: e.timezone },
      end: { dateTime: end.toISOString(), timeZone: e.timezone },
      attendees: e.guestEmail ? [{ email: e.guestEmail }] : undefined,
      reminders: { useDefault: true },
    },
  });
  return { id: res.data.id ?? null, htmlLink: res.data.htmlLink ?? null, meetingLink: e.meetingLink ?? null };
}

// Delete an event (used when a meeting is rescheduled — kill the old slot so it doesn't ghost).
export async function deleteEvent(calendarId: string, eventId: string, credentials?: GCreds | null): Promise<void> {
  const cal = getCalendar(credentials);
  await cal.events.delete({ calendarId, eventId });
}
