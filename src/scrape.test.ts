import assert from "node:assert/strict";
import { selectNewLeads, type Place } from "./scrape";

// The non-trivial bit is the phone filter/dedupe — check it with fake data, no network.
const places: Place[] = [
  { title: "A", phoneUnformatted: "+15125551111" },
  { title: "B", phone: "+15125552222" }, // formatted-only phone is still usable
  { title: "C" }, // no phone -> skipped
  { title: "Dup of A", phoneUnformatted: "+15125551111" }, // intra-batch dup -> skipped
  { title: "Already in DB", phoneUnformatted: "+15125559999" }, // known phone -> skipped
];

const { rows, noPhone, dup } = selectNewLeads(places, "acct-1", new Set(["+15125559999"]));

assert.equal(rows.length, 2);
assert.equal(noPhone, 1);
assert.equal(dup, 2); // intra-batch dup + already-known
assert.equal(rows[0].phone, "+15125551111");
assert.equal(rows[0].account_id, "acct-1");
assert.equal(rows[0].state, "new");
console.log("scrape selectNewLeads: ok");
