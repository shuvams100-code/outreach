// Verify the service account can READ the calendar, and (with `create`) WRITE a test event.
//   npm run probe-calendar           → read busy times
//   npm run probe-calendar -- create → also create a test event (then delete it from your calendar)
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { getBusy, computeFreeSlots, createEvent } from "../src/calendar";

const calendarId = process.env.GOOGLE_CALENDAR_ID;
if (!calendarId) { console.error("Missing GOOGLE_CALENDAR_ID in .env"); process.exit(1); }

const now = new Date();
const weekLater = new Date(now.getTime() + 7 * 86_400_000);

console.log(`Reading busy times on ${calendarId} for the next 7 days…`);
const busy = await getBusy(calendarId, now, weekLater);
console.log(`OK — calendar reachable. ${busy.length} busy block(s).`);

const slots = computeFreeSlots(busy, {
  from: now, horizonDays: 7, tz: "America/New_York",
  dayStartHour: 9, dayEndHour: 17, durationMin: 30, bufferMin: 15, maxSlots: 5,
});
console.log(`\nNext ${slots.length} open 30-min slots (shown in UTC):`);
for (const s of slots) console.log("  " + s);

if (process.argv[2] === "create") {
  if (!slots.length) { console.error("No open slot to test with."); process.exit(1); }
  console.log("\nCreating a TEST event in the first open slot…");
  const ev = await createEvent(calendarId, {
    summary: "Reacher TEST — delete me",
    description: "Test event from probe-calendar. Safe to delete.",
    startIso: slots[0],
    durationMin: 30,
    timezone: "America/New_York",
  });
  console.log("Created:", ev.id);
  console.log("Event link:", ev.htmlLink);
  console.log("Meet link :", ev.meetLink ?? "(none — Google declined a Meet link for this account)");
  console.log("→ Check your Google Calendar, confirm it appears (with the Meet link), then delete it.");
}
