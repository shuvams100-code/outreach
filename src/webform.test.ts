import assert from "node:assert/strict";
import { mapWebformLead } from "./webform";

// full submission → mapped lead
let lead = mapWebformLead(
  { Name: "Jane Doe", Phone: "(512) 555-1234", Email: "jane@acme.com", Company: "Acme", Website: "https://acme.com", message: "interested" },
  "acct-1",
);
assert.ok(lead);
assert.equal(lead!.phone, "+15125551234");
assert.equal(lead!.first_name, "Jane");
assert.equal(lead!.last_name, "Doe");
assert.equal(lead!.email, "jane@acme.com");
assert.equal(lead!.business_name, "Acme");
assert.equal(lead!.timezone, "America/Chicago"); // 512 = Austin TX
assert.equal(lead!.source, "web_form");
assert.equal((lead!.raw_data as any).website, "https://acme.com");
console.log("mapWebformLead full: ok");

// alternate field names (mobile, full_name) still work
lead = mapWebformLead({ full_name: "Bob Smith", mobile: "512-555-9999" }, "acct-1");
assert.equal(lead!.phone, "+15125559999");
assert.equal(lead!.first_name, "Bob");
console.log("mapWebformLead alt keys: ok");

// no usable phone → null (rejected, not inserted)
assert.equal(mapWebformLead({ name: "No Phone", email: "x@y.com" }, "acct-1"), null);
assert.equal(mapWebformLead({}, "acct-1"), null);
console.log("mapWebformLead no phone: ok");
