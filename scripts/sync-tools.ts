// Attach the two booking tools to tenant-0's VAPI assistant, pointing at the public tunnel URL.
// Writes into accounts.vapi_assistant.model.tools (single source of truth) — the test-assistant
// sync and real outbound calls both spread that config, so both get the tools.
//
// Run AFTER you have a public URL (ngrok / Vercel):
//   VAPI_TOOLS_URL=https://xxxx.ngrok-free.app/vapi/tools  npm run sync-tools
// Then:  npm run make-test-assistant   (to web-test in the browser)
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { supabase } from "../src/lib/supabase";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";
const url = process.env.VAPI_TOOLS_URL;
if (!url) {
  console.error("Set VAPI_TOOLS_URL to your public tools endpoint, e.g.");
  console.error("  VAPI_TOOLS_URL=https://xxxx.ngrok-free.app/vapi/tools  npm run sync-tools");
  process.exit(1);
}

const tools = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description:
        "Get open meeting slots to offer the prospect. Call this the moment the prospect agrees to a meeting, before booking.",
      parameters: { type: "object", properties: {}, required: [] },
    },
    server: { url },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description:
        "Book one slot on the calendar. Pass the exact `start` value from check_availability plus the prospect's details. Only call after check_availability.",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", description: "ISO start datetime of the chosen slot, copied exactly from check_availability" },
          name: { type: "string", description: "Prospect's name" },
          company: { type: "string", description: "Prospect's company" },
          phone: { type: "string", description: "Prospect's phone number" },
          notes: { type: "string", description: "Anything useful for the meeting" },
        },
        required: ["start"],
      },
    },
    server: { url },
  },
];

const { data, error } = await supabase
  .from("accounts")
  .select("vapi_assistant")
  .eq("id", TENANT0_ID)
  .single();
if (error || !data?.vapi_assistant) { console.error("Could not load tenant-0 vapi_assistant:", error?.message); process.exit(1); }

const assistant = data.vapi_assistant as any;
assistant.model = { ...(assistant.model ?? {}), tools };

const { error: uErr } = await supabase.from("accounts").update({ vapi_assistant: assistant }).eq("id", TENANT0_ID);
if (uErr) { console.error("Update failed:", uErr.message); process.exit(1); }

console.log(`Attached check_availability + book_appointment → ${url}`);
console.log("Next:  npm run make-test-assistant   then web-test the agent in VAPI.");
