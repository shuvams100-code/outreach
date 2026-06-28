import assert from "node:assert/strict";
import { PRESETS, buildPresetUpdate, listPresets, SCRIPT_VARIANTS } from "./presets";

// listPresets exposes every preset with the fields the dropdown needs (incl. category)
const list = listPresets();
assert.ok(list.length >= 9); // 6 original + 3 new
assert.ok(list.every((p) => p.key && p.label && p.category));
assert.ok(list.some((p) => p.category === "data"));
assert.ok(list.some((p) => p.category === "custom"));
assert.ok(list.some((p) => p.category === "followup")); // new category
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

// new preset: ai_reminders (followup category)
u = buildPresetUpdate([PRESETS.ai_reminders]);
assert.deepEqual(u.enabled_tools, ["check_availability", "book_appointment", "capture_fields", "opt_out_customer"]);
assert.equal(u.scraping_enabled, false);
assert.ok(u.system_prompt);
assert.ok((u.system_prompt as string).includes("remind"));
console.log("buildPresetUpdate ai_reminders: ok");

// new preset: list_clean (data category, sources_enabled for opt-out check)
u = buildPresetUpdate([PRESETS.list_clean]);
assert.deepEqual(u.enabled_tools, []);
assert.equal(u.scraping_enabled, true); // uses opt-out check
assert.equal(u.vapi_assistant, undefined);
console.log("buildPresetUpdate list_clean: ok");

// new preset: lead_enrich (data category, sources_enabled for enrichment)
u = buildPresetUpdate([PRESETS.lead_enrich]);
assert.deepEqual(u.enabled_tools, []);
assert.equal(u.scraping_enabled, true);
assert.equal(u.vapi_assistant, undefined);
console.log("buildPresetUpdate lead_enrich: ok");

// script variant support: passing { key, script_variant } to buildPresetUpdate
u = buildPresetUpdate([{ key: "outbound_sales", script_variant: "appointment_setting" }]);
assert.ok(u.system_prompt);
console.log("buildPresetUpdate script_variant: ok");

// a variant actually CHANGES the prompt — different variants yield different scripts,
// and a non-default variant differs from the preset's own prompt
const promptApptSet = buildPresetUpdate([{ key: "outbound_sales", script_variant: "appointment_setting" }]).system_prompt;
const promptReactivate = buildPresetUpdate([{ key: "outbound_sales", script_variant: "db_reactivation" }]).system_prompt;
assert.notEqual(promptApptSet, promptReactivate);
assert.notEqual(promptApptSet, PRESETS.outbound_sales.system_prompt);
// the variant prompt is what flows into the assistant model
assert.equal((buildPresetUpdate([{ key: "outbound_sales", script_variant: "db_reactivation" }]).vapi_assistant as any).model.messages[0].content, promptReactivate);
// a "default"-style variant (no prompt) falls back to the preset's own prompt
assert.equal(buildPresetUpdate([{ key: "ai_reminders", script_variant: "confirmation" }]).system_prompt, PRESETS.ai_reminders.system_prompt);
// unknown variant is rejected
assert.throws(() => buildPresetUpdate([{ key: "outbound_sales", script_variant: "nope" }]), /Unknown script_variant/);
console.log("buildPresetUpdate variant changes prompt: ok");

// script variant shows in multi-compose label
u = buildPresetUpdate([
  { key: "outbound_sales", script_variant: "db_reactivation" },
  PRESETS.lead_qualification
]);
assert.ok((u.system_prompt as string).includes("Outbound Sales (AI SDR) (db_reactivation)"));
console.log("buildPresetUpdate multi with variant: ok");

// SCRIPT_VARIANTS registry exists and has expected keys
assert.ok(SCRIPT_VARIANTS.outbound_sales);
assert.ok(SCRIPT_VARIANTS.lead_qualification);
assert.ok(SCRIPT_VARIANTS.ai_reminders);
assert.ok(SCRIPT_VARIANTS.lead_gen);
assert.ok(SCRIPT_VARIANTS.list_clean);
assert.ok(SCRIPT_VARIANTS.lead_enrich);
console.log("SCRIPT_VARIANTS registry: ok");

// CLIENT'S OWN SCRIPT: override replaces the preset script and is fed to VAPI verbatim
const myScript = "Hi, I'm calling from B2B Widgets Inc about your procurement needs. [exact client wording]";
u = buildPresetUpdate([PRESETS.outbound_sales], { override: { system_prompt: myScript } });
assert.equal(u.system_prompt, myScript);                                   // preset text replaced
assert.equal((u.vapi_assistant as any).model.messages[0].content, myScript); // fed to VAPI as-is
assert.deepEqual(u.enabled_tools, ["check_availability", "book_appointment", "opt_out_customer"]); // plumbing still from preset
assert.equal(u.scraping_enabled, true);
console.log("buildPresetUpdate custom script override: ok");

// override first_message/success fall back to the preset when not given
assert.equal(u.first_message, PRESETS.outbound_sales.first_message);
assert.equal(u.success_definition, PRESETS.outbound_sales.success_definition);
// ...and are used when given
u = buildPresetUpdate([PRESETS.outbound_sales], { override: { system_prompt: myScript, first_message: "Hey!", success_definition: "Deal closed" } });
assert.equal(u.first_message, "Hey!");
assert.equal(u.success_definition, "Deal closed");
assert.equal((u.vapi_assistant as any).firstMessage, "Hey!");
console.log("buildPresetUpdate override first_message/success: ok");

// custom script + voice together (BuildOptions object form)
u = buildPresetUpdate([PRESETS.outbound_sales], { voiceId: "VX9", override: { system_prompt: myScript } });
assert.equal((u.vapi_assistant as any).voice.voiceId, "VX9");
assert.equal((u.vapi_assistant as any).model.messages[0].content, myScript);
console.log("buildPresetUpdate override + voice: ok");

// back-compat: bare voiceId string still works as before
assert.equal((buildPresetUpdate([PRESETS.outbound_sales], "OLD123").vapi_assistant as any).voice.voiceId, "OLD123");
console.log("buildPresetUpdate back-compat voiceId string: ok");

console.log("All preset tests passed!");
