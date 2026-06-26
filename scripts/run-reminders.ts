// Run the reminder-call sweep once (all accounts). On Vercel this runs on a ~15-min cron.
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { runReminderSweep } from "../src/reminders";

const r = await runReminderSweep();
console.log(`Reminder sweep — ${r.placed} call(s) placed · ${r.skipped} skipped`);
