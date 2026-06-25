import assert from "node:assert/strict";
import { isAnswered, classifyCall, type RetryRules } from "./outcome";

const rules: RetryRules = { max_attempts: 3, gap_days: 3 };
const now = new Date("2026-06-25T12:00:00.000Z");
const in3days = "2026-06-28T12:00:00.000Z";

// isAnswered
assert.equal(isAnswered("customer-did-not-answer"), false);
assert.equal(isAnswered("voicemail"), false);
assert.equal(isAnswered("customer-busy"), false);
assert.equal(isAnswered("pipeline-error-openai-llm-failed"), false); // error → retry
assert.equal(isAnswered(undefined), false);                          // unknown → retry
assert.equal(isAnswered("customer-ended-call"), true);
assert.equal(isAnswered("assistant-ended-call"), true);
console.log("isAnswered: ok");

// no answer, first miss → retry scheduled +3 days
let r = classifyCall({ endedReason: "customer-did-not-answer" }, 0, rules, now);
assert.equal(r.outcome, "no_answer");
assert.equal(r.lead.state, "no_answer");
assert.equal(r.lead.retry_count, 1);
assert.equal(r.lead.next_retry_at, in3days);
console.log("no_answer retry: ok");

// no answer, 3rd miss (count was 2) → exhausted, drops from queue
r = classifyCall({ endedReason: "voicemail" }, 2, rules, now);
assert.equal(r.lead.retry_count, 3);
assert.equal(r.lead.next_retry_at, null);
console.log("no_answer exhausted: ok");

// answered + agent booked → booked
r = classifyCall({ endedReason: "customer-ended-call", analysis: { structuredData: { outcome: "booked" } } }, 0, rules, now);
assert.equal(r.outcome, "booked");
assert.equal(r.lead.state, "booked");
assert.equal(r.lead.next_retry_at, undefined); // no retry on a booking
console.log("booked: ok");

// answered, no booking signal → not_interested
r = classifyCall({ endedReason: "customer-ended-call" }, 0, rules, now);
assert.equal(r.outcome, "not_interested");
assert.equal(r.lead.state, "not_interested");
console.log("not_interested: ok");
