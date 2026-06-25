// Verify the real booking flow end-to-end: list slots from the account config, then book the first
// one (creates a real event with the Meet link). Delete the test event from your calendar after.
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { getAvailableSlots, bookSlot } from "../src/booking";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const slots = await getAvailableSlots(TENANT0_ID);
console.log(`Next ${slots.length} open slots:`);
for (const s of slots) console.log(`  ${s.label}   (${s.startIso})`);

if (process.argv[2] === "book") {
  if (!slots.length) { console.error("No slot to book."); process.exit(1); }
  console.log(`\nBooking the first slot for a test prospect…`);
  const r = await bookSlot(TENANT0_ID, slots[0].startIso, { name: "Test Broker", company: "Acme Insurance", phone: "+15125550100" });
  console.log("Booked:", r.label);
  console.log("Meeting link:", r.meetingLink ?? "(none)");
  console.log("Event id:", r.eventId);
  console.log("→ Check your calendar; confirm the event + Meet link, then delete it.");
}
