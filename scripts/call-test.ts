import { loadCallAccount, placeCall, pollCall } from "../src/call";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const to = process.argv[2];
if (!to) {
  console.error("Usage: npm run call-test -- <phone in +1 format>");
  console.error("Example: npm run call-test -- +15551234567   (use YOUR own mobile to test)");
  process.exit(1);
}

const acct = await loadCallAccount(TENANT0_ID);
console.log(`Placing call to ${to} using tenant-0's agent…`);
const id = await placeCall(acct, to, "Test");
console.log(`Call created (${id}). Your phone should ring shortly — pick up and talk to the agent.`);
console.log("Polling for the result (this waits until the call ends)…\n");

const call = await pollCall(id);
console.log("── Call ended ──");
console.log("reason  :", call.endedReason ?? "-");
console.log("cost    :", call.cost != null ? `$${call.cost}` : "-");
console.log("summary :", call.summary ?? "-");
console.log("\nTranscript:\n" + (call.transcript ?? "(none)"));
if (call.recordingUrl) console.log("\nRecording:", call.recordingUrl);
