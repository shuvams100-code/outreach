// Attach the account's enabled tools (its "endings") to its VAPI assistant, pointing at the public URL.
// Tools come from the registry in src/tools.ts, filtered to the account's `enabled_tools` — so a Sales
// account gets the booking tools, a Qualifier account gets capture_fields, etc. Nothing hardcoded.
// Writes into accounts.vapi_assistant.model.tools (single source of truth).
//
// Run AFTER you have a public URL (ngrok / Vercel):
//   VAPI_TOOLS_URL=https://xxxx.ngrok-free.app/vapi/tools  npm run sync-tools
// Then:  npm run make-test-assistant   (to web-test in the browser)
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { supabase } from "../src/lib/supabase";
import { toolDefs } from "../src/tools";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";
const url = process.env.VAPI_TOOLS_URL;
if (!url) {
  console.error("Set VAPI_TOOLS_URL to your public tools endpoint, e.g.");
  console.error("  VAPI_TOOLS_URL=https://xxxx.ngrok-free.app/vapi/tools  npm run sync-tools");
  process.exit(1);
}

const { data, error } = await supabase
  .from("accounts")
  .select("vapi_assistant, enabled_tools")
  .eq("id", TENANT0_ID)
  .single();
if (error || !data?.vapi_assistant) { console.error("Could not load tenant-0 vapi_assistant:", error?.message); process.exit(1); }

const enabled = (data.enabled_tools as string[] | null) ?? ["check_availability", "book_appointment"];
const defs = toolDefs(url);
const tools = enabled.map((name) => defs[name]).filter(Boolean);
const missing = enabled.filter((name) => !defs[name]);
if (missing.length) console.warn(`Warning: no tool definition for: ${missing.join(", ")}`);

const assistant = data.vapi_assistant as any;
assistant.model = { ...(assistant.model ?? {}), tools };

const { error: uErr } = await supabase.from("accounts").update({ vapi_assistant: assistant }).eq("id", TENANT0_ID);
if (uErr) { console.error("Update failed:", uErr.message); process.exit(1); }

console.log(`Attached [${enabled.join(", ")}] → ${url}`);
console.log("Next:  npm run make-test-assistant   then web-test the agent in VAPI.");
