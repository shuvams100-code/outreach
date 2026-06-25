import { callContact } from "../src/call";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const leadId = process.argv[2];
if (!leadId) {
  console.error("Usage: npm run call-contact -- <lead-id>");
  console.error("Places a real call to that contact, saves the result, updates its state.");
  process.exit(1);
}

const r = await callContact(TENANT0_ID, leadId);
console.log(`Call ${r.callId} → outcome: ${r.outcome} · lead now: ${r.leadState}`);
