import assert from "node:assert/strict";
import { timezoneFromPhone, extractEmail } from "./enrich";

// timezoneFromPhone — pure function, covers all 7 US timezone buckets + unknown
assert.equal(timezoneFromPhone("+12125551234"), "America/New_York");    // 212 NYC
assert.equal(timezoneFromPhone("+13125551234"), "America/Chicago");     // 312 Chicago
assert.equal(timezoneFromPhone("+13035551234"), "America/Denver");      // 303 Denver
assert.equal(timezoneFromPhone("+14805551234"), "America/Phoenix");     // 480 Phoenix (no DST)
assert.equal(timezoneFromPhone("+12135551234"), "America/Los_Angeles"); // 213 LA
assert.equal(timezoneFromPhone("+19075551234"), "America/Anchorage");   // 907 Alaska
assert.equal(timezoneFromPhone("+18085551234"), "Pacific/Honolulu");    // 808 Hawaii
assert.equal(timezoneFromPhone("+19995551234"), null);                  // 999 unknown
// handles unformatted 10-digit too
assert.equal(timezoneFromPhone("5125551234"), "America/Chicago");       // 512 Austin TX
console.log("timezoneFromPhone: ok");

// extractEmail — pure function
assert.equal(extractEmail("contact hello@example.com for info"), "hello@example.com");
assert.equal(extractEmail("no email here"), null);
console.log("extractEmail: ok");
