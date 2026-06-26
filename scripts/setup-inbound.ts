// Enable inbound answering: assign the account's saved VAPI assistant to its phone number,
// so calls TO the number are answered by the agent (qualify + book — same engine as outbound).
//
// Prereq:  npm run make-test-assistant   (creates/updates the saved assistant)
// Run:     npm run setup-inbound
//
// ponytail: tenant-0 uses one saved assistant on one number. Real multi-tenant inbound resolves
// the assistant per called-number via VAPI's assistant-request webhook — that needs the public
// server (Vercel), so it lands with deploy. This direct assignment is the right move for now.
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { loadCallAccount } from "../src/call";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";
const ASSISTANT_NAME = "Reacher Test (tenant-0)";
const key = process.env.VAPI_API_KEY;
if (!key) { console.error("No VAPI_API_KEY in .env"); process.exit(1); }
const auth = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const acct = await loadCallAccount(TENANT0_ID);
const phoneNumberId = acct.vapi_phone_numbers?.[0];
if (!phoneNumberId) { console.error("Account has no vapi_phone_numbers configured"); process.exit(1); }

// Find the saved assistant by name (created by make-test-assistant).
const list = await fetch("https://api.vapi.ai/assistant", { headers: auth });
const assistant = ((await list.json()) as { id: string; name?: string }[]).find((a) => a.name === ASSISTANT_NAME);
if (!assistant) {
  console.error(`No saved assistant named "${ASSISTANT_NAME}". Run first:  npm run make-test-assistant`);
  process.exit(1);
}

// Assign it to the number for inbound.
const res = await fetch(`https://api.vapi.ai/phone-number/${phoneNumberId}`, {
  method: "PATCH",
  headers: auth,
  body: JSON.stringify({ assistantId: assistant.id }),
});
console.log("HTTP", res.status);
const body = await res.text();
if (!res.ok) { console.error("BODY:", body); process.exit(1); }

const num = (JSON.parse(body) as { number?: string }).number ?? "(your VAPI number)";
console.log(`Inbound enabled — calls to ${num} are now answered by "${ASSISTANT_NAME}".`);
console.log("Test by calling the number. Live booking during an inbound call lights up once the");
console.log("tools URL is public (Vercel) and you've run sync-tools with it.");
