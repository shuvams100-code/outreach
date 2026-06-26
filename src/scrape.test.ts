import assert from "node:assert/strict";
import { selectNewLeads, normalizeDomain } from "./scrape";

// --- normalizeDomain ---
assert.equal(normalizeDomain("https://www.Acme.com/contact"), "acme.com");
assert.equal(normalizeDomain("acme.com"), "acme.com");
assert.equal(normalizeDomain(null), null);
assert.equal(normalizeDomain("not a url"), null);
console.log("normalizeDomain: ok");

// --- selectNewLeads: ads, no-phone, phone dedupe, name/email/website capture ---
const listings = [
  { name: "A Agency", phone: "(512) 555-1111", website: "https://a-agency.com", email: "hi@a-agency.com" },
  { name: "B Agency", phone: "512-555-2222" },                       // no website → still valid
  { name: "Sponsored", phone: "512-555-3333", isAd: true },          // ad → dropped
  { name: "C No Phone" },                                            // no phone → skipped
  { name: "Dup of A", phone: "(512) 555-1111" },                    // same phone → skipped
  { name: "Known", phone: "512-555-9999" },                          // already in DB → skipped
];
const seenPhones = new Set(["+15125559999"]);
const seenDomains = new Set<string>();
const { rows, noPhone, dup, ads } =
  selectNewLeads(listings, "acct-1", seenPhones, seenDomains, "yellow_pages", (i) => i.isAd === true);

assert.equal(rows.length, 2);                 // A + B
assert.equal(ads, 1);
assert.equal(noPhone, 1);
assert.equal(dup, 2);                          // phone dup + already-known
assert.equal(rows[0].phone, "+15125551111");
assert.equal(rows[0].business_name, "A Agency");
assert.equal(rows[0].email, "hi@a-agency.com");
assert.equal(rows[0].raw_data.website, "https://a-agency.com");
assert.equal(rows[0].source, "yellow_pages");
assert.equal(rows[0].state, "new");
console.log("scrape selectNewLeads: ok");

// --- cross-source domain dedupe: same business, DIFFERENT phone, from a second source → skipped ---
const fromMaps = [{ title: "A Agency (Maps)", phone: "512-555-7777", website: "http://www.a-agency.com" }];
const r2 = selectNewLeads(fromMaps, "acct-1", seenPhones, seenDomains, "google_maps");
assert.equal(r2.rows.length, 0);   // a-agency.com domain already seen from the YP run
assert.equal(r2.dup, 1);
console.log("scrape cross-source domain dedupe: ok");
