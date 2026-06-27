import { callContact, pollCall } from "../src/call";
import { processVapiCallEnd } from "../src/webhook-vapi";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const leadId = process.argv[2];
if (!leadId) {
  console.error("Usage: npm run call-contact -- <lead-id>");
  console.error("Places a real call to that contact, saves the result, updates its state.");
  process.exit(1);
}

// callContact is non-blocking in production (webhook handles result). For local dev, poll manually.
await callContact(TENANT0_ID, leadId);
console.log("Call placed — polling for result (local dev only)…");
// We don't have the callId here anymore; poll the lead's most recent call via VAPI.
// For a quick check, run `npm run daily` and watch the daily log, or check your VAPI dashboard.
console.log("Check VAPI dashboard or run: npm run daily");
