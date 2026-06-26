import assert from "node:assert/strict";
import { bookingSlackText } from "./notify";

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
