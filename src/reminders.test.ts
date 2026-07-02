import assert from "node:assert/strict";
import { selectDueReminders, reminderFirstMessage, type DueBooking } from "./reminders";

const now = new Date("2026-07-02T14:00:00.000Z");
const b = (over: Partial<DueBooking>): DueBooking => ({
  id: "x", account_id: "a", lead_id: "l", meeting_at: null, reminder_1h_sent_at: null, status: "open", ...over,
});

// in-window (40 min out) → due
let due = selectDueReminders([b({ id: "soon", meeting_at: "2026-07-02T14:40:00.000Z" })], now);
assert.equal(due.length, 1);
assert.equal(due[0].id, "soon");

// too far out (2h) → not due
due = selectDueReminders([b({ meeting_at: "2026-07-02T16:00:00.000Z" })], now);
assert.equal(due.length, 0);

// already in the past → not due
due = selectDueReminders([b({ meeting_at: "2026-07-02T13:00:00.000Z" })], now);
assert.equal(due.length, 0);

// already reminded → not due
due = selectDueReminders([b({ meeting_at: "2026-07-02T14:30:00.000Z", reminder_1h_sent_at: "2026-07-02T13:45:00.000Z" })], now);
assert.equal(due.length, 0);

// closed booking → not due
due = selectDueReminders([b({ meeting_at: "2026-07-02T14:30:00.000Z", status: "closed" })], now);
assert.equal(due.length, 0);
console.log("selectDueReminders: ok");

assert.ok(reminderFirstMessage("Thu, Jul 2, 3:30 PM EDT").includes("Thu, Jul 2, 3:30 PM EDT"));
// AI-disclosure line must stay in the opener (FCC proposed rule + some states already require it).
assert.match(reminderFirstMessage("Thu, Jul 2, 3:30 PM EDT"), /automated call/i);
console.log("reminderFirstMessage: ok");
