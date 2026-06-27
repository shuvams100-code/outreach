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

export type SlotOpts = {
  from: Date;
  horizonDays: number;   // how many days ahead to search
  tz: string;            // timezone the working hours are expressed in
  dayStartHour: number;  // e.g. 9
  dayEndHour: number;    // e.g. 17
  durationMin: number;   // meeting length
  bufferMin: number;     // gap between meetings
  maxSlots: number;      // stop after this many
};

// Open meeting slots: Mon–Fri, inside working hours (in `tz`), not overlapping a busy block,
// and in the future. Returns ISO start times (UTC).
export function computeFreeSlots(busy: BusyBlock[], o: SlotOpts): string[] {
  const busyR = busy.map((b) => [Date.parse(b.start), Date.parse(b.end)] as const);
  const step = o.durationMin + o.bufferMin;
  const out: string[] = [];

  for (let d = 0; d < o.horizonDays && out.length < o.maxSlots; d++) {
    const { year, month, day, weekday } = partsInTz(new Date(o.from.getTime() + d * 86_400_000), o.tz);
    if (weekday === "Sat" || weekday === "Sun") continue;

    for (let min = o.dayStartHour * 60; min + o.durationMin <= o.dayEndHour * 60; min += step) {
      const start = wallTimeToUtc(year, month, day, Math.floor(min / 60), min % 60, o.tz);
      if (start.getTime() <= o.from.getTime()) continue; // future only
      const end = new Date(start.getTime() + o.durationMin * 60_000);
      const clash = busyR.some(([bs, be]) => start.getTime() < be && end.getTime() > bs);
      if (!clash) {
        out.push(start.toISOString());
        if (out.length >= o.maxSlots) break;
      }
    }
  }
  return out;
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
