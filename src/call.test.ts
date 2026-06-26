import assert from "node:assert/strict";
import { buildContextOverride } from "./call";

const baseAssistant = { model: { provider: "openai", model: "gpt-4o-mini", messages: [{ role: "system", content: "base script" }] } };

// no profile → no override (agent just uses its normal script)
assert.equal(buildContextOverride(baseAssistant, "Acme", null), undefined);
console.log("buildContextOverride no profile: ok");

// profile present → appends a context system message, preserves provider/model + base messages
const ov = buildContextOverride(baseAssistant, "Acme Insurance", "They sell commercial auto policies to trucking fleets.") as any;
assert.equal(ov.model.provider, "openai");
assert.equal(ov.model.model, "gpt-4o-mini");
assert.equal(ov.model.messages.length, 2);
assert.equal(ov.model.messages[0].content, "base script");        // base kept
assert.ok(ov.model.messages[1].content.includes("Acme Insurance"));
assert.ok(ov.model.messages[1].content.includes("trucking fleets"));
console.log("buildContextOverride with profile: ok");

// tolerates an assistant with no model/messages
const ov2 = buildContextOverride(null, "X Corp", "profile text") as any;
assert.equal(ov2.model.messages.length, 1);
assert.ok(ov2.model.messages[0].content.includes("X Corp"));
console.log("buildContextOverride empty assistant: ok");
