import { scrubAccount } from "../src/compliance";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const r = await scrubAccount(TENANT0_ID);
console.log(
  `Scrub done — ${r.processed} leads · ${r.scrubbed} scrubbed · ` +
    `${r.disqualified} disqualified · ${r.errors} errors`,
);
