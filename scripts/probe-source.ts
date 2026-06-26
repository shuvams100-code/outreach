// Cheaply confirm a source actor's real output fields (~3 records, a few cents) before trusting it.
//   npm run probe-source -- google_maps
//   npm run probe-source -- yellow_pages
//   npm run probe-source -- manta
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { ADAPTERS } from "../src/scrape";

const key = process.argv[2];
const token = process.env.APIFY_TOKEN;
if (!token) { console.error("Missing APIFY_TOKEN in .env"); process.exit(1); }
if (!key || !(key in ADAPTERS)) {
  console.error(`Usage: npm run probe-source -- <key>   (one of: ${Object.keys(ADAPTERS).join(", ")})`);
  process.exit(1);
}

const adapter = ADAPTERS[key];
const input = adapter.buildInput({ search_query: "insurance brokers", geo_city: "Austin", geo_state: "TX" }, 3);
console.log(`Running ${key} (${adapter.actor}) — 3 records…`);

const res = await fetch(
  `https://api.apify.com/v2/acts/${adapter.actor}/run-sync-get-dataset-items?token=${token}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
);
if (!res.ok) { console.error(`Run failed (${res.status}):`, await res.text()); process.exit(1); }
const items = (await res.json()) as Record<string, unknown>[];

console.log(`Got ${items.length} record(s).`);
if (items[0]) {
  console.log("\nField names on the first record:\n  " + Object.keys(items[0]).join(", "));
  console.log("\nFirst record (full):\n" + JSON.stringify(items[0], null, 2));
}
console.log("\n→ Confirm name/phone/website/email map in src/scrape.ts (NAME_KEYS/PHONE_KEYS/WEBSITE_KEYS).");
