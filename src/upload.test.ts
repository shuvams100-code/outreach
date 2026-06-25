import assert from "node:assert/strict";
import { normalizePhone, parseCsv, selectUploadLeads } from "./upload";

// --- normalizePhone ---
assert.equal(normalizePhone("(512) 555-1234"), "+15125551234"); // formatted 10-digit
assert.equal(normalizePhone("1-512-555-1234"), "+15125551234"); // 11-digit with leading 1
assert.equal(normalizePhone("512.555.1234"), "+15125551234");   // dotted
assert.equal(normalizePhone("12345"), null);                    // too short → rejected
assert.equal(normalizePhone(""), null);
console.log("normalizePhone: ok");

// --- parseCsv (quoted field with a comma inside) ---
const csv = `Name,Phone,Email,Company
John Smith,(512) 555-1111,john@a.com,"Smith, Jones & Co"
Jane Doe,512-555-2222,jane@b.com,Doe Agency`;
const rows = parseCsv(csv);
assert.equal(rows.length, 2);
assert.equal(rows[0]["company"], "Smith, Jones & Co"); // comma stayed inside the quotes
assert.equal(rows[1]["phone"], "512-555-2222");
console.log("parseCsv: ok");

// --- selectUploadLeads: dedupe, opt-out, no-phone, name split ---
const raw = [
  { name: "John Smith", phone: "(512) 555-1111", email: "john@a.com", company: "Smith Co" },
  { name: "Dup John", phone: "512-555-1111", email: "", company: "" },     // same number → dup
  { name: "No Phone Bob", phone: "", email: "bob@x.com", company: "" },     // no phone → skip
  { name: "Blocked Sue", phone: "713-555-9999", email: "", company: "" },   // on opt-out
];
const blocked = new Set(["+17135559999"]);
const { rows: out, skippedNoPhone, dup, blocked: blockedCount } =
  selectUploadLeads(raw, "acct-1", new Set(), blocked);

assert.equal(out.length, 2);          // John + Blocked Sue (dup & no-phone dropped)
assert.equal(dup, 1);
assert.equal(skippedNoPhone, 1);
assert.equal(blockedCount, 1);
assert.equal(out[0].first_name, "John");          // full name split
assert.equal(out[0].last_name, "Smith");
assert.equal(out[0].state, "scrubbed");           // clean → cleared to call
assert.equal(out[0].timezone, "America/Chicago"); // 512 = Austin TX
assert.equal(out[1].state, "disqualified");       // on opt-out
console.log("selectUploadLeads: ok");
