import assert from "node:assert/strict";
import { PRESETS, buildPresetUpdate, listPresets } from "./presets";

// listPresets exposes every preset with the fields the dropdown needs (incl. category)
const list = listPresets();
assert.ok(list.length >= 6);
assert.ok(list.every((p) => p.key && p.label && p.category));
assert.ok(list.some((p) => p.category === "data"));
assert.ok(list.some((p) => p.category === "custom"));
console.log("listPresets: ok");

// single preset → booking endings + auto opt-out, scraping on, assistant assembled from the script
let u = buildPresetUpdate([PRESETS.outbound_sales]);
assert.deepEqual(u.enabled_tools, ["check_availability", "book_appointment", "opt_out_customer"]);
assert.equal(u.scraping_enabled, true);
assert.equal((u.vapi_assistant as any).model.messages[0].content, u.system_prompt);
console.log("buildPresetUpdate single: ok");

// MULTIPLE presets → union the tools (+ auto opt-out), OR the scraping, layer the scripts into one agent
u = buildPresetUpdate([PRESETS.inbound_receptionist, PRESETS.outbound_sales]);
const tools = u.enabled_tools as string[];
assert.ok(tools.includes("check_availability") && tools.includes("book_appointment") && tools.includes("capture_fields"));
assert.ok(tools.includes("opt_out_customer"));        // every calling agent gets opt-out (TCPA)
assert.equal(tools.length, 4); // 3 unioned endings + opt_out_customer
assert.equal(u.scraping_enabled, true); // sales turns sources on
assert.ok((u.system_prompt as string).includes("AI Receptionist"));
assert.ok((u.system_prompt as string).includes("Outbound Sales")); // both roles layered in
console.log("buildPresetUpdate multi-compose: ok");

// data-only (lead_gen) → sources on, NO endings, NO script written (agent left manual)
u = buildPresetUpdate([PRESETS.lead_gen]);
assert.deepEqual(u.enabled_tools, []);
assert.equal(u.scraping_enabled, true);
assert.equal(u.vapi_assistant, undefined);   // no calling agent for data-only
assert.equal(u.system_prompt, undefined);
console.log("buildPresetUpdate data-only: ok");

// custom (blank) → everything off, nothing scripted
u = buildPresetUpdate([PRESETS.custom]);
assert.deepEqual(u.enabled_tools, []);
assert.equal(u.scraping_enabled, false);
assert.equal(u.vapi_assistant, undefined);
console.log("buildPresetUpdate custom: ok");

// voice override flows through on a scripted preset
assert.equal((buildPresetUpdate([PRESETS.outbound_sales], "VOICE123").vapi_assistant as any).voice.voiceId, "VOICE123");
console.log("buildPresetUpdate voice: ok");
