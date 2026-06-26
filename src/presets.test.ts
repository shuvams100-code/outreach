import assert from "node:assert/strict";
import { PRESETS, buildPresetUpdate, listPresets } from "./presets";

// listPresets exposes every preset with the fields the dropdown needs
const list = listPresets();
assert.ok(list.length >= 4);
assert.ok(list.every((p) => p.key && p.label && p.direction));
console.log("listPresets: ok");

// Sales preset → booking endings, scraping on, assistant assembled from the script
let u = buildPresetUpdate(PRESETS.outbound_sales);
assert.deepEqual(u.enabled_tools, ["check_availability", "book_appointment"]);
assert.equal(u.scraping_enabled, true);
assert.equal(u.sources.length, 3);
assert.equal((u.vapi_assistant.model.messages[0] as any).content, u.system_prompt);
assert.ok(u.vapi_assistant.firstMessage.length > 0);
console.log("buildPresetUpdate sales: ok");

// Receptionist → inbound, capture + booking endings, scraping OFF, no sources
u = buildPresetUpdate(PRESETS.inbound_receptionist);
assert.ok(u.enabled_tools.includes("capture_fields"));
assert.ok(u.enabled_tools.includes("book_appointment"));
assert.equal(u.scraping_enabled, false);
assert.equal(u.sources.length, 0);
console.log("buildPresetUpdate receptionist: ok");

// Qualifier / Complaint → capture only
assert.deepEqual(buildPresetUpdate(PRESETS.lead_qualification).enabled_tools, ["capture_fields"]);
assert.deepEqual(buildPresetUpdate(PRESETS.complaint_intake).enabled_tools, ["capture_fields"]);

// voice override flows through
assert.equal(buildPresetUpdate(PRESETS.outbound_sales, "VOICE123").vapi_assistant.voice.voiceId, "VOICE123");
console.log("buildPresetUpdate capture/voice: ok");
