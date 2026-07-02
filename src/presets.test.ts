import assert from "node:assert/strict";
import { PRESETS, buildPresetUpdate, listPresets, SCRIPT_VARIANTS } from "./presets";

// listPresets exposes every preset with the fields the dropdown needs (incl. category)
// 2026-07-02: outbound calling removed (TCPA) — 5 presets remain: 2 inbound + 3 data-only/custom.
const list = listPresets();
assert.equal(list.length, 5);
assert.ok(list.every((p) => p.key && p.label && p.category));
assert.ok(list.some((p) => p.category === "data"));
assert.ok(list.some((p) => p.category === "custom"));
assert.ok(list.some((p) => p.category === "inbound"));
console.log("listPresets: ok");

// single preset → booking endings + auto opt-out, assistant assembled from the script
let u = buildPresetUpdate([PRESETS.inbound_receptionist]);
assert.deepEqual(u.enabled_tools, ["check_availability", "book_appointment", "capture_fields", "opt_out_customer"]);
assert.equal(u.scraping_enabled, false); // inbound never scrapes
assert.equal((u.vapi_assistant as any).model.messages[0].content, u.system_prompt);
console.log("buildPresetUpdate single: ok");

// MULTIPLE presets → union the tools (+ auto opt-out), layer the scripts into one agent
u = buildPresetUpdate([PRESETS.inbound_receptionist, PRESETS.complaint_intake]);
const tools = u.enabled_tools as string[];
assert.ok(tools.includes("check_availability") && tools.includes("book_appointment") && tools.includes("capture_fields"));
assert.ok(tools.includes("opt_out_customer")); // every calling agent gets opt-out (TCPA)
assert.equal(tools.length, 4); // 3 unioned endings + opt_out_customer
assert.ok((u.system_prompt as string).includes("AI Receptionist"));
assert.ok((u.system_prompt as string).includes("Complaint / Support Line")); // both roles layered in
console.log("buildPresetUpdate multi-compose: ok");

// data-only (lead_gen) → sources on, NO endings, NO script written (agent left manual)
u = buildPresetUpdate([PRESETS.lead_gen]);
assert.deepEqual(u.enabled_tools, []);
assert.equal(u.scraping_enabled, true);
assert.equal(u.vapi_assistant, undefined); // no calling agent for data-only
assert.equal(u.system_prompt, undefined);
console.log("buildPresetUpdate data-only: ok");

// custom (blank) → everything off, nothing scripted
u = buildPresetUpdate([PRESETS.custom]);
assert.deepEqual(u.enabled_tools, []);
assert.equal(u.scraping_enabled, false);
assert.equal(u.vapi_assistant, undefined);
console.log("buildPresetUpdate custom: ok");

// voice override flows through on a scripted preset
assert.equal((buildPresetUpdate([PRESETS.inbound_receptionist], "VOICE123").vapi_assistant as any).voice.voiceId, "VOICE123");
console.log("buildPresetUpdate voice: ok");

// new preset: lead_enrich (data category, sources_enabled for enrichment)
u = buildPresetUpdate([PRESETS.lead_enrich]);
assert.deepEqual(u.enabled_tools, []);
assert.equal(u.scraping_enabled, true);
assert.equal(u.vapi_assistant, undefined);
console.log("buildPresetUpdate lead_enrich: ok");

// script variant support: a "default"-style variant (no prompt) falls back to the preset's own prompt
u = buildPresetUpdate([{ key: "inbound_receptionist", script_variant: "default" }]);
assert.equal(u.system_prompt, PRESETS.inbound_receptionist.system_prompt);
console.log("buildPresetUpdate script_variant: ok");

// unknown variant is rejected
assert.throws(() => buildPresetUpdate([{ key: "inbound_receptionist", script_variant: "nope" }]), /Unknown script_variant/);
console.log("buildPresetUpdate variant changes prompt: ok");

// SCRIPT_VARIANTS registry exists and has expected keys
assert.ok(SCRIPT_VARIANTS.inbound_receptionist);
assert.ok(SCRIPT_VARIANTS.complaint_intake);
assert.ok(SCRIPT_VARIANTS.lead_gen);
assert.ok(SCRIPT_VARIANTS.lead_enrich);
console.log("SCRIPT_VARIANTS registry: ok");

// CLIENT'S OWN SCRIPT: override replaces the preset script and is fed to VAPI verbatim
const myScript = "Thanks for calling — I'm here about your account. [exact client wording]";
u = buildPresetUpdate([PRESETS.inbound_receptionist], { override: { system_prompt: myScript } });
assert.equal(u.system_prompt, myScript); // preset text replaced
assert.equal((u.vapi_assistant as any).model.messages[0].content, myScript); // fed to VAPI as-is
assert.deepEqual(u.enabled_tools, ["check_availability", "book_appointment", "capture_fields", "opt_out_customer"]); // plumbing still from preset
console.log("buildPresetUpdate custom script override: ok");

// override first_message/success fall back to the preset when not given
assert.equal(u.first_message, PRESETS.inbound_receptionist.first_message);
assert.equal(u.success_definition, PRESETS.inbound_receptionist.success_definition);
// ...and are used when given
u = buildPresetUpdate([PRESETS.inbound_receptionist], { override: { system_prompt: myScript, first_message: "Hey!", success_definition: "Resolved" } });
assert.equal(u.first_message, "Hey!");
assert.equal(u.success_definition, "Resolved");
assert.equal((u.vapi_assistant as any).firstMessage, "Hey!");
console.log("buildPresetUpdate override first_message/success: ok");

// custom script + voice together (BuildOptions object form)
u = buildPresetUpdate([PRESETS.inbound_receptionist], { voiceId: "VX9", override: { system_prompt: myScript } });
assert.equal((u.vapi_assistant as any).voice.voiceId, "VX9");
assert.equal((u.vapi_assistant as any).model.messages[0].content, myScript);
console.log("buildPresetUpdate override + voice: ok");

// back-compat: bare voiceId string still works as before
assert.equal((buildPresetUpdate([PRESETS.inbound_receptionist], "OLD123").vapi_assistant as any).voice.voiceId, "OLD123");
console.log("buildPresetUpdate back-compat voiceId string: ok");

console.log("All preset tests passed!");
