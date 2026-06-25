import { supabase } from "./lib/supabase";
import { callContact } from "./call";
import type { RetryRules } from "./outcome";

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

// ---------- pure: is it a legal moment to call THIS lead (their local time)? ----------

// Mon–Fri and within [startHour, endHour) in the lead's own timezone.
// ponytail: US federal holidays not checked here yet — add the holidays table at the compliance step.
export function isWithinCallingWindow(
  timezone: string | null | undefined,
  startHour: number,
  endHour: number,
  now: Date,
): boolean {
  const tz = timezone ?? "America/New_York";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  return isWeekday && hour >= startHour && hour < endHour;
}

// ---------- orchestrator: run the daily outbound cycle for one account ----------
// Built; live-verify pending a US-reachable number (placing real calls is blocked from here).

const hourOf = (t: string | null | undefined, fallback: number) =>
  t ? parseInt(t.split(":")[0], 10) : fallback;

export async function runDailyAccount(accountId: string, now: Date = new Date()) {
  const { data: acct, error } = await supabase
    .from("accounts")
    .select("status, daily_dial_cap, retry_rules, calling_hours_start, calling_hours_end")
    .eq("id", accountId)
    .single();
  if (error || !acct) throw new Error(`Account ${accountId} not found: ${error?.message}`);
  if (acct.status !== "active") return { skipped: "account not active" as const };

  // ponytail: capacity throttle (open bookings vs booking_capacity) goes here once bookings exist (1c).

  const rules = (acct.retry_rules as RetryRules) ?? { max_attempts: 3, gap_days: 3 };
  const cap = acct.daily_dial_cap ?? 40;
  const share = (acct.retry_rules as { max_share?: number })?.max_share ?? 0.4;
  const startHour = hourOf(acct.calling_hours_start as string, 9);
  const endHour = hourOf(acct.calling_hours_end as string, 18);
  const nowIso = now.toISOString();

  const [{ data: retriesDue }, { data: fresh }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, phone, first_name, timezone")
      .eq("account_id", accountId)
      .eq("state", "no_answer")
      .lt("retry_count", rules.max_attempts)
      .lte("next_retry_at", nowIso)
      .order("next_retry_at", { ascending: true }),
    supabase
      .from("leads")
      .select("id, phone, first_name, timezone")
      .eq("account_id", accountId)
      .eq("state", "scrubbed")
      .order("created_at", { ascending: true }),
  ]);

  const { list, retries, fresh: freshN, retryOverflow } = selectCallList(
    (retriesDue ?? []) as Candidate[],
    (fresh ?? []) as Candidate[],
    cap,
    share,
  );

  // Only dial leads whose local calling window is open right now.
  const callable = list.filter((l) => isWithinCallingWindow(l.timezone, startHour, endHour, now));

  let booked = 0, noAnswer = 0, notInterested = 0, errors = 0;
  for (const lead of callable) {
    try {
      const r = await callContact(accountId, lead.id);
      if (r.outcome === "booked") booked++;
      else if (r.outcome === "no_answer") noAnswer++;
      else notInterested++;
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
    dialed: callable.length,
    booked,
    noAnswer,
    notInterested,
    errors,
  };
}
