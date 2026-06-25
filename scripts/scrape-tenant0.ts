import { scrapeAccount } from "../src/scrape";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const r = await scrapeAccount(TENANT0_ID);
console.log(
  `Scrape done — ${r.scraped} found · ${r.inserted} new leads inserted · ` +
    `${r.skippedDuplicates} dup · ${r.skippedNoPhone} no-phone`,
);
