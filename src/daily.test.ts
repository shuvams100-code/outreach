import assert from "node:assert/strict";
import { selectCallList, isWithinCallingWindow, isUsFederalHoliday, atCapacity, type Candidate } from "./daily";

const mk = (n: number, p = "r"): Candidate[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${p}${i}`, phone: `+1555000${i}` }));

// --- selectCallList ---
// 20 retries due + 50 fresh, cap 40, 40% share → 16 retries (4 overflow) + 24 fresh = 40
let s = selectCallList(mk(20, "r"), mk(50, "f"), 40, 0.4);
assert.equal(s.retries, 16);
assert.equal(s.retryOverflow, 4);
assert.equal(s.fresh, 24);
assert.equal(s.list.length, 40);
assert.equal(s.capLeft, 0);

// few retries → no overflow, fresh fills the rest
s = selectCallList(mk(5, "r"), mk(50, "f"), 40, 0.4);
assert.equal(s.retries, 5);
assert.equal(s.retryOverflow, 0);
assert.equal(s.fresh, 35);

// not enough leads → list under cap, capLeft reports the gap
s = selectCallList(mk(0), mk(10, "f"), 40, 0.4);
assert.equal(s.list.length, 10);
assert.equal(s.capLeft, 30);

// retries only, none fresh → capped at 16, rest overflow
s = selectCallList(mk(20, "r"), [], 40, 0.4);
assert.equal(s.retries, 16);
assert.equal(s.retryOverflow, 4);
assert.equal(s.fresh, 0);
console.log("selectCallList: ok");

// --- isWithinCallingWindow --- (2026-06-25 is a Thursday, 06-27 a Saturday)
// Same UTC instant: 11am in New York (in window) but only 8am in LA (before 9) — proves per-tz eval.
const thu15Z = new Date("2026-06-25T15:00:00Z");
assert.equal(isWithinCallingWindow("America/New_York", 9, 18, thu15Z), true);     // 11:00 EDT
assert.equal(isWithinCallingWindow("America/Los_Angeles", 9, 18, thu15Z), false); // 08:00 PDT — too early
assert.equal(isWithinCallingWindow("America/New_York", 9, 18, new Date("2026-06-25T02:00:00Z")), false); // 22:00 Wed — too late
assert.equal(isWithinCallingWindow("America/New_York", 9, 18, new Date("2026-06-27T15:00:00Z")), false); // Saturday
// Christmas 2026 is a Friday (a weekday) but a holiday → no calls. Noon ET = 17:00 UTC.
assert.equal(isWithinCallingWindow("America/New_York", 9, 18, new Date("2026-12-25T17:00:00Z")), false);
console.log("isWithinCallingWindow: ok");

// --- isUsFederalHoliday (2026) ---
assert.equal(isUsFederalHoliday(2026, 1, 1), true);    // New Year's
assert.equal(isUsFederalHoliday(2026, 1, 19), true);   // MLK — 3rd Mon Jan
assert.equal(isUsFederalHoliday(2026, 5, 25), true);   // Memorial — last Mon May
assert.equal(isUsFederalHoliday(2026, 7, 4), true);    // Independence
assert.equal(isUsFederalHoliday(2026, 9, 7), true);    // Labor — 1st Mon Sep
assert.equal(isUsFederalHoliday(2026, 11, 26), true);  // Thanksgiving — 4th Thu Nov
assert.equal(isUsFederalHoliday(2026, 12, 25), true);  // Christmas
assert.equal(isUsFederalHoliday(2026, 3, 17), false);  // ordinary day
assert.equal(isUsFederalHoliday(2026, 11, 27), false); // day after Thanksgiving — not federal
// observed shifts: Jul 4 2026 is a Saturday → observed Fri Jul 3; Jan 1 2023 is a Sunday → observed Mon Jan 2
assert.equal(isUsFederalHoliday(2026, 7, 3), true);
assert.equal(isUsFederalHoliday(2023, 1, 2), true);
assert.equal(isUsFederalHoliday(2026, 7, 10), false);  // an ordinary Friday, nowhere near a holiday
console.log("isUsFederalHoliday: ok");

// --- atCapacity ---
assert.equal(atCapacity(20, 20), true);   // at ceiling → pause
assert.equal(atCapacity(21, 20), true);   // over
assert.equal(atCapacity(19, 20), false);  // room left
assert.equal(atCapacity(99, null), false);// no capacity set → never throttle
console.log("atCapacity: ok");
