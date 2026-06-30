import assert from "node:assert/strict";
import { wallTimeToUtc, computeFreeSlots, type BusyBlock } from "./calendar";

// --- wallTimeToUtc: DST-correct ---
// 9:00 AM New York in June is EDT (UTC-4) → 13:00 UTC
assert.equal(wallTimeToUtc(2026, 6, 25, 9, 0, "America/New_York").toISOString(), "2026-06-25T13:00:00.000Z");
// 9:00 AM New York in January is EST (UTC-5) → 14:00 UTC
assert.equal(wallTimeToUtc(2026, 1, 15, 9, 0, "America/New_York").toISOString(), "2026-01-15T14:00:00.000Z");
// 9:00 AM Los Angeles in June is PDT (UTC-7) → 16:00 UTC
assert.equal(wallTimeToUtc(2026, 6, 25, 9, 0, "America/Los_Angeles").toISOString(), "2026-06-25T16:00:00.000Z");
console.log("wallTimeToUtc: ok");

// --- computeFreeSlots ---
// Thursday 2026-06-25, search from 00:00 ET, 9–17 ET, 60-min slots, no buffer.
const from = new Date("2026-06-25T04:00:00Z"); // 00:00 ET Thu (early, so the whole day is "future")
const opts = {
  from, horizonDays: 1, tz: "America/New_York",
  dayStartHour: 9, dayEndHour: 17, durationMin: 60, bufferMin: 0, maxSlots: 20,
};

// No busy → 8 hourly slots 9,10,…,16 (last ends 17)
let slots = computeFreeSlots([], opts);
assert.equal(slots.length, 8);
assert.equal(slots[0], "2026-06-25T13:00:00.000Z"); // 9am ET
assert.equal(slots[7], "2026-06-25T20:00:00.000Z"); // 4pm ET

// Busy 10–11am ET (14:00–15:00Z) removes exactly the 10am slot
const busy: BusyBlock[] = [{ start: "2026-06-25T14:00:00Z", end: "2026-06-25T15:00:00Z" }];
slots = computeFreeSlots(busy, opts);
assert.equal(slots.length, 7);
assert.ok(!slots.includes("2026-06-25T14:00:00.000Z")); // 10am ET gone
assert.ok(slots.includes("2026-06-25T13:00:00.000Z"));  // 9am ET stays
console.log("computeFreeSlots: ok");

// Weekend is skipped: search only Saturday → zero slots
const sat = { ...opts, from: new Date("2026-06-27T04:00:00Z") };
assert.equal(computeFreeSlots([], sat).length, 0);
console.log("computeFreeSlots weekend skip: ok");

// --- format-scoped windows ---
// Thursday, in-person 9–12 + online 13–17 (Mon–Fri). Request online → only afternoon slots.
const split = {
  from, horizonDays: 1, tz: "America/New_York", durationMin: 60, bufferMin: 0, maxSlots: 20,
  windows: [
    { dayStartHour: 9, dayEndHour: 12, days: [1, 2, 3, 4, 5], format: "in_person" as const },
    { dayStartHour: 13, dayEndHour: 17, days: [1, 2, 3, 4, 5], format: "online" as const },
  ],
};
const online = computeFreeSlots([], { ...split, format: "online" });
assert.equal(online.length, 4); // 13,14,15,16 ET
assert.equal(online[0], "2026-06-25T17:00:00.000Z"); // 1pm ET
assert.ok(!online.includes("2026-06-25T13:00:00.000Z")); // 9am ET (in-person) excluded
const inperson = computeFreeSlots([], { ...split, format: "in_person" });
assert.equal(inperson.length, 3); // 9,10,11 ET
assert.ok(inperson.includes("2026-06-25T13:00:00.000Z")); // 9am ET present
// "both" request sees every window
assert.equal(computeFreeSlots([], { ...split, format: "both" }).length, 7);
console.log("computeFreeSlots format windows: ok");

// --- shared time: a busy block blocks the slot regardless of the requested format ---
// 1pm ET online slot is taken (by anything) → it must disappear from an online request too.
const busyOnline: BusyBlock[] = [{ start: "2026-06-25T17:00:00Z", end: "2026-06-25T18:00:00Z" }];
const afterBusy = computeFreeSlots(busyOnline, { ...split, format: "online" });
assert.ok(!afterBusy.includes("2026-06-25T17:00:00.000Z"));
assert.equal(afterBusy.length, 3);
console.log("computeFreeSlots shared-time busy: ok");
