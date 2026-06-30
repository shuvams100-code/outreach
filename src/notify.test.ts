import assert from "node:assert/strict";
import { bookingSlackText, buildIcs, bookingEmail } from "./notify";

// with link
let t = bookingSlackText("Reacher AI", "Jane Doe", "Thu, Jul 2, 3:30 PM EDT", "https://meet.google.com/abc");
assert.ok(t.includes("Reacher AI"));
assert.ok(t.includes("Jane Doe"));
assert.ok(t.includes("Thu, Jul 2, 3:30 PM EDT"));
assert.ok(t.includes("https://meet.google.com/abc"));

// no link → no Link line
t = bookingSlackText("", "+15125550100", "Fri, Jul 3, 9:00 AM EDT", null);
assert.ok(!t.includes("Link:"));
assert.ok(t.includes("+15125550100"));
console.log("bookingSlackText: ok");

// --- buildIcs ---
const ics = buildIcs({
  uid: "acc1-123@reacher.ai",
  startIso: "2026-07-02T19:30:00.000Z",
  durationMin: 30,
  summary: "Reacher AI ↔ Jane",
  location: "https://meet.google.com/abc",
  stampIso: "2026-07-01T00:00:00.000Z",
});
assert.ok(ics.startsWith("BEGIN:VCALENDAR"));
assert.ok(ics.trimEnd().endsWith("END:VCALENDAR"));
assert.ok(ics.includes("DTSTART:20260702T193000Z"));
assert.ok(ics.includes("DTEND:20260702T200000Z"));   // +30 min
assert.ok(ics.includes("UID:acc1-123@reacher.ai"));
assert.ok(ics.includes("LOCATION:https://meet.google.com/abc"));
assert.ok(ics.includes("\r\n")); // CRLF line endings
// escaping: a comma in the summary is backslash-escaped
assert.ok(buildIcs({ uid: "u", startIso: "2026-07-02T19:30:00Z", durationMin: 30, summary: "A, B; C" }).includes("SUMMARY:A\\, B\\; C"));
console.log("buildIcs: ok");

// --- bookingEmail: online carries a Join link in the body (not .ics-only) ---
let em = bookingEmail("customer", {
  businessName: "Sunrise Dental", meetingLabel: "Thu, Jul 2, 3:30 PM EDT",
  format: "online", meetingLink: "https://meet.google.com/abc", address: null, customerName: "Jane",
});
assert.ok(em.subject.includes("Sunrise Dental"));
assert.ok(em.html.includes("https://meet.google.com/abc")); // link is in the body
assert.ok(em.text.includes("Online"));

// in-person carries the address + a maps link, never a join link
em = bookingEmail("client", {
  businessName: "Sunrise Dental", meetingLabel: "Thu, Jul 2, 3:30 PM EDT",
  format: "in_person", meetingLink: null, address: "12 Main St, Austin TX", customerName: "Jane",
});
assert.ok(em.html.includes("12 Main St, Austin TX"));
assert.ok(em.html.includes("maps.google.com"));
assert.ok(!em.html.includes("Join the meeting"));
assert.ok(em.text.includes("In person"));
console.log("bookingEmail: ok");
