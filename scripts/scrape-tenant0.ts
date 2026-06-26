import { scrapeAccount } from "../src/scrape";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const r = await scrapeAccount(TENANT0_ID);
console.log(`Scrape done — ${r.inserted} new leads inserted across sources:`);
for (const [src, stats] of Object.entries(r.perSource)) {
  console.log(`  ${src}: ${JSON.stringify(stats)}`);
}
if (r.unknownSources.length) console.log(`  (no adapter for: ${r.unknownSources.join(", ")})`);
console.log("Next: npm run enrich   (researches each, applies your ICP) → npm run scrub → ready to call");
