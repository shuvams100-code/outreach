// Sync tenant-0's vapi_assistant config → a saved VAPI assistant named "Reacher Test (tenant-0)",
// so you can web-test it (talk to Alex in the browser). Idempotent: updates the same one each run.
// Test convenience only — production calls use the inline config straight from our DB.
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { loadCallAccount, buildCallOverrides } from "../src/call";
import { supabase } from "../src/lib/supabase";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";
const NAME = "Reacher Test (tenant-0)";
const key = process.env.VAPI_API_KEY;
if (!key) { console.error("No VAPI_API_KEY"); process.exit(1); }
const auth = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const acct = await loadCallAccount(TENANT0_ID);
if (!acct.vapi_assistant) { console.error("Tenant-0 has no vapi_assistant"); process.exit(1); }

// Bake the knowledge base into the saved assistant so INBOUND calls (which use this saved assistant,
// not per-call overrides) can answer questions about the business.
const { data: kbRow } = await supabase.from("accounts").select("broker_knowledge_base").eq("id", TENANT0_ID).single();
const ov = buildCallOverrides(acct.vapi_assistant as Record<string, any>, { knowledgeBase: kbRow?.broker_knowledge_base });
const assistantConfig = ov ? { ...acct.vapi_assistant, model: ov.model } : acct.vapi_assistant;
const payload = { name: NAME, ...assistantConfig };

// Find an existing assistant with our name → update it; otherwise create it.
const list = await fetch("https://api.vapi.ai/assistant", { headers: auth });
const existing = ((await list.json()) as { id: string; name?: string }[]).find((a) => a.name === NAME);

const res = existing
  ? await fetch(`https://api.vapi.ai/assistant/${existing.id}`, { method: "PATCH", headers: auth, body: JSON.stringify(payload) })
  : await fetch("https://api.vapi.ai/assistant", { method: "POST", headers: auth, body: JSON.stringify(payload) });

console.log("HTTP", res.status);
const body = await res.text();
if (!res.ok) { console.error("BODY:", body); process.exit(1); }
const a = JSON.parse(body) as { id: string };
console.log(`${existing ? "Updated" : "Created"} assistant: ${a.id}`);
console.log(`Open VAPI → Assistants → "${NAME}" → Talk/Test to try the new objection handling.`);
