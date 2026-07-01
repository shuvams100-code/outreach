import { supabase } from "./lib/supabase";
import { callContact } from "./call";
import { scrapeAccount } from "./scrape";
import { enrichAccount } from "./enrich";
import { scrubAccount } from "./compliance";
import type { RetryRules } from "./outcome";

// An active calling service means this account has an agent that actually dials — scraping chosen as
// ITS lead source should feed the daily cycle automatically, never a separate manual step. The standalone
// "Lead Generation & Enrichment" service (no calling service active) never reaches runDailyAccount at all,
// so it's unaffected — that one stays manual, by design (there's no agent here to feed).
const CALLING_SERVICES = ["Outbound Sales / Appt Setting", "Reactivation & Renewals", "Lead Qualification"];

export type Candidate = { id: string; phone: string; first_name?: string | null; timezone?: string | null };

// ---------- pure: pick today's call list (the "clever part") ----------

// Fill the daily cap in priority order: retries-due first (capped at a share of the day so old
// misses never crowd out fresh leads), then fresh `scrubbed` leads. Retry overflow rolls to tomorrow.
export function selectCallList(
  retriesDue: Candidate[],
  freshScrubbed: Candidate[],
  cap: number,
  maxRetryShare: number,
) {
  const retryCap = Math.floor(cap * maxRetryShare);
  const retries = retriesDue.slice(0, retryCap);
  const retryOverflow = Math.max(0, retriesDue.length - retryCap);
  const remaining = cap - retries.length;
  const fresh = freshScrubbed.slice(0, Math.max(0, remaining));
  const list = [...retries, ...fresh];
  return { list, retries: retries.length, fresh: fresh.length, retryOverflow, capLeft: cap - list.length };
}

// ---------- pure: US federal holidays (rule-based, no external API) ----------

const dow = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
// Day-of-month of the nth `weekday` in a month (e.g. 3rd Monday). weekday: 0=Sun..6=Sat.
const nthWeekday = (y: number, m: number, weekday: number, n: number) => {
  const offset = (weekday - dow(y, m, 1) + 7) % 7;
  return 1 + offset + (n - 1) * 7;
};
const lastWeekday = (y: number, m: number, weekday: number) => {
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return days - ((dow(y, m, days) - weekday + 7) % 7);
};

// The 11 US federal holidays on their actual date (month is 1-12).
function isActualHoliday(y: number, m: number, d: number): boolean {
  if (m === 1 && d === 1) return true;                       // New Year's
  if (m === 6 && d === 19) return true;                      // Juneteenth
  if (m === 7 && d === 4) return true;                       // Independence Day
  if (m === 11 && d === 11) return true;                     // Veterans Day
  if (m === 12 && d === 25) return true;                     // Christmas
  if (m === 1 && d === nthWeekday(y, 1, 1, 3)) return true;  // MLK Day — 3rd Mon Jan
  if (m === 2 && d === nthWeekday(y, 2, 1, 3)) return true;  // Presidents' Day — 3rd Mon Feb
  if (m === 5 && d === lastWeekday(y, 5, 1)) return true;    // Memorial Day — last Mon May
  if (m === 9 && d === nthWeekday(y, 9, 1, 1)) return true;  // Labor Day — 1st Mon Sep
  if (m === 10 && d === nthWeekday(y, 10, 1, 2)) return true;// Columbus Day — 2nd Mon Oct
  if (m === 11 && d === nthWeekday(y, 11, 4, 4)) return true;// Thanksgiving — 4th Thu Nov
  return false;
}

// True if the date is a federal holiday OR its OBSERVED bank-closure day: a holiday on Saturday is
// observed the Friday before, on Sunday the Monday after (when offices are actually shut).
export function isUsFederalHoliday(y: number, m: number, d: number): boolean {
  if (isActualHoliday(y, m, d)) return true;
  const wd = dow(y, m, d);
  if (wd === 5) { const t = new Date(Date.UTC(y, m - 1, d + 1)); if (isActualHoliday(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())) return true; } // Fri: Sat-holiday observed today
  if (wd === 1) { const t = new Date(Date.UTC(y, m - 1, d - 1)); if (isActualHoliday(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())) return true; } // Mon: Sun-holiday observed today
  return false;
}

// ---------- pure: is it a legal moment to call THIS lead (their local time)? ----------

// Mon–Fri, not a US federal holiday, and within [startHour, endHour) in the lead's own timezone.
export function isWithinCallingWindow(
  timezone: string | null | undefined,
  startHour: number,
  endHour: number,
  now: Date,
): boolean {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short", hour: "2-digit", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
  };
  // A bad/misspelled IANA timezone in the DB makes Intl throw — fall back rather than crash the whole run.
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone ?? "America/New_York", ...opts }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", ...opts }).formatToParts(now);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday");
  if (["Sat", "Sun"].includes(weekday)) return false;
  if (isUsFederalHoliday(+get("year"), +get("month"), +get("day"))) return false;
  const hour = parseInt(get("hour") || "0", 10);
  return hour >= startHour && hour < endHour;
}

// ---------- pure: booking capacity throttle ----------

// True when the account is at/over its open-booking ceiling → outbound dialing should pause.
export function atCapacity(openBookings: number, capacity: number | null | undefined): boolean {
  return capacity != null && openBookings >= capacity;
}

// ---------- orchestrator: run the daily outbound cycle for one account ----------
// Built; live-verify pending a US-reachable number (placing real calls is blocked from here).

const hourOf = (t: string | null | undefined, fallback: number) =>
  t ? parseInt(t.split(":")[0], 10) : fallback;

export async function runDailyAccount(accountId: string, now: Date = new Date()) {
  const { data: acct, error } = await supabase
    .from("accounts")
    .select("status, daily_dial_cap, retry_rules, calling_hours_start, calling_hours_end, booking_capacity, balance, scraping_enabled, refill_threshold, active_services")
    .eq("id", accountId)
    .single();
  if (error || !acct) throw new Error(`Account ${accountId} not found: ${error?.message}`);
  if (acct.status !== "active") return { skipped: "account not active" as const };
  if (typeof acct.balance === "number" && acct.balance <= 0) {
    return { skipped: "insufficient balance" as const };
  }

  // Capacity throttle: if open bookings already meet the client's ceiling, stop producing more.
  const { count: openBookings } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId)
    .eq("status", "open");
  if (atCapacity(openBookings ?? 0, acct.booking_capacity)) {
    return { skipped: "at booking capacity" as const, openBookings: openBookings ?? 0, capacity: acct.booking_capacity };
  }

  // Auto lead-refill: an active calling service that chose scraping as its lead source feeds itself —
  // no separate manual "run lead generation" click. Scraping Refill Guard (per the build spec): only
  // scrape more when the ready-to-call backlog is actually running low, since every scraped/enriched
  // lead has a real Apify/LLM cost — don't re-buy leads the account already has sitting in `scrubbed`.
  let refillError: string | undefined;
  const hasCallingService = ((acct.active_services as string[]) ?? []).some((s) => CALLING_SERVICES.includes(s));
  if (acct.scraping_enabled && hasCallingService) {
    const { count: backlog } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("state", "scrubbed");
    if ((backlog ?? 0) < (acct.refill_threshold ?? 20)) {
      try {
        await scrapeAccount(accountId);
        await enrichAccount(accountId);
        await scrubAccount(accountId);
      } catch (e) {
        refillError = (e as Error).message;
        console.error(`Auto lead-refill failed for account ${accountId}:`, refillError);
      }
    }
  }

  // Reap leads stranded in `calling` by a crashed/killed run (older than an hour) → back to scrubbed,
  // so they're never orphaned out of the queue. (A live call is <5 min, so 1h is a safe threshold.)
  await supabase
    .from("leads")
    .update({ state: "scrubbed" })
    .eq("account_id", accountId)
    .eq("state", "calling")
    .lt("last_called_at", new Date(now.getTime() - 3_600_000).toISOString());

  const rules = (acct.retry_rules as RetryRules) ?? { max_attempts: 3, gap_days: 3 };
  const cap = acct.daily_dial_cap ?? 40;
  const share = (acct.retry_rules as { max_share?: number })?.max_share ?? 0.4;
  const startHour = hourOf(acct.calling_hours_start as string, 9);
  const endHour = hourOf(acct.calling_hours_end as string, 18);
  const nowIso = now.toISOString();

  const retryCap = Math.ceil(cap * share);
  const [{ data: retriesDue }, { data: fresh }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, phone, first_name, timezone")
      .eq("account_id", accountId)
      .eq("state", "no_answer")
      .lt("retry_count", rules.max_attempts)
      .lte("next_retry_at", nowIso)
      .order("next_retry_at", { ascending: true })
      .limit(retryCap),
    supabase
      .from("leads")
      .select("id, phone, first_name, timezone")
      .eq("account_id", accountId)
      .eq("state", "scrubbed")
      .order("created_at", { ascending: true })
      .limit(cap),
  ]);

  const { list, retries, fresh: freshN, retryOverflow } = selectCallList(
    (retriesDue ?? []) as Candidate[],
    (fresh ?? []) as Candidate[],
    cap,
    share,
  );

  // Only dial leads whose local calling window is open right now.
  const callable = list.filter((l) => isWithinCallingWindow(l.timezone, startHour, endHour, now));

  // callContact is fire-and-forget: it places the call and returns. Outcomes arrive via the VAPI
  // end-of-call webhook (processVapiCallEnd in webhook-vapi.ts), not inline here.
  let dialed = 0, errors = 0;
  for (const lead of callable) {
    try {
      await callContact(accountId, lead.id);
      dialed++;
    } catch (e) {
      errors++;
      console.error(`Call to ${lead.id} failed:`, (e as Error).message);
    }
  }

  return {
    selected: list.length,
    retries,
    fresh: freshN,
    retryOverflow,
    outsideWindow: list.length - callable.length,
    dialed,
    errors,
    refillError,
  };
}
