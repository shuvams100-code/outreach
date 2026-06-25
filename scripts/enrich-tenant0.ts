import { enrichAccount } from "../src/enrich";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const r = await enrichAccount(TENANT0_ID);
console.log(
  `\nEnrich done — ${r.processed} leads · ${r.enriched} enriched · ` +
    `${r.disqualified} disqualified · ${r.failed} failed (left new) · ${r.errors} errors`,
);
