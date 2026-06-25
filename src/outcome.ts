// Turn a finished VAPI call into: an outcome label, and the lead's next state + retry fields.
// Pure + deterministic (takes `now` as a param) so it's fully unit-testable without a real call.

export type VapiResult = {
  endedReason?: string;
  analysis?: { structuredData?: { outcome?: string } };
};

export type RetryRules = { max_attempts: number; gap_days: number };

// endedReason substrings that mean no real conversation happened → retry, don't burn the lead.
// Errors are included: a failed call should be retried, not counted as a rejection.
const NOT_ANSWERED = ["did-not-answer", "no-answer", "busy", "voicemail", "failed", "error", "did-not-give"];

export function isAnswered(endedReason: string | undefined): boolean {
  const r = (endedReason ?? "").toLowerCase();
  if (!r) return false; // unknown reason → treat as not answered (safer: retry rather than discard)
  return !NOT_ANSWERED.some((s) => r.includes(s));
}

export type LeadOutcome = {
  outcome: "no_answer" | "booked" | "not_interested";
  lead: {
    state: "no_answer" | "booked" | "not_interested";
    retry_count?: number;
    next_retry_at?: string | null;
    last_called_at: string;
  };
};

export function classifyCall(
  result: VapiResult,
  currentRetryCount: number,
  rules: RetryRules,
  now: Date,
): LeadOutcome {
  const nowIso = now.toISOString();

  if (!isAnswered(result.endedReason)) {
    const retry_count = currentRetryCount + 1;
    const exhausted = retry_count >= rules.max_attempts;
    return {
      outcome: "no_answer",
      lead: {
        state: "no_answer",
        retry_count,
        // exhausted → drop from the retry queue (null); else schedule the next attempt.
        next_retry_at: exhausted
          ? null
          : new Date(now.getTime() + rules.gap_days * 86_400_000).toISOString(),
        last_called_at: nowIso,
      },
    };
  }

  // Answered: the agent's structured outcome decides booked vs not. That structured data gets
  // wired with the booking tool (next step); until then only an explicit "booked" counts as booked.
  // ponytail: "interested-but-didn't-book" collapses to not_interested for now — no state for it yet.
  const booked = result.analysis?.structuredData?.outcome === "booked";
  return {
    outcome: booked ? "booked" : "not_interested",
    lead: { state: booked ? "booked" : "not_interested", last_called_at: nowIso },
  };
}
