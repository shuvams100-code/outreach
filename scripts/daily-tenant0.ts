import { runDailyAccount } from "../src/daily";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const r = await runDailyAccount(TENANT0_ID);
if ("skipped" in r) {
  console.log(`Daily run skipped — ${r.skipped}`);
} else {
  console.log(
    `Daily run — selected ${r.selected} (${r.retries} retries, ${r.fresh} fresh, ${r.retryOverflow} rolled over) · ` +
      `dialed ${r.dialed} (${r.outsideWindow} outside calling window) · ` +
      `${r.booked} booked · ${r.noAnswer} no-answer · ${r.notInterested} not-interested · ${r.errors} errors`,
  );
}
