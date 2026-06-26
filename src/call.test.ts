import assert from "node:assert/strict";
import { buildCallOverrides } from "./call";

const base = { model: { provider: "openai", model: "gpt-4o-mini", messages: [{ role: "system", content: "base script" }] } };

// nothing to add → no override (agent uses its normal script)
assert.equal(buildCallOverrides(base, {}), undefined);
assert.equal(buildCallOverrides(base, { profile: null, knowledgeBase: "" }), undefined);
console.log("buildCallOverrides none: ok");

// lead profile only → one appended system message, base preserved
let ov = buildCallOverrides(base, { businessName: "Acme Insurance", profile: "They sell commercial auto to trucking fleets." }) as any;
assert.equal(ov.model.provider, "openai");
assert.equal(ov.model.messages.length, 2);
assert.equal(ov.model.messages[0].content, "base script");
assert.ok(ov.model.messages[1].content.includes("Acme Insurance"));
assert.ok(ov.model.messages[1].content.includes("trucking fleets"));
console.log("buildCallOverrides profile: ok");

// knowledge base + profile → two appended messages (KB first, then lead context)
ov = buildCallOverrides(base, { knowledgeBase: "We install solar panels. Free quotes. 25-year warranty.", businessName: "X", profile: "Homeowner in Austin." }) as any;
assert.equal(ov.model.messages.length, 3);
assert.ok(ov.model.messages[1].content.includes("solar panels"));      // KB
assert.ok(ov.model.messages[2].content.includes("Homeowner in Austin")); // lead context
console.log("buildCallOverrides knowledge base + profile: ok");

// knowledge base only, tolerates assistant with no model/messages
ov = buildCallOverrides(null, { knowledgeBase: "FAQ stuff" }) as any;
assert.equal(ov.model.messages.length, 1);
assert.ok(ov.model.messages[0].content.includes("FAQ stuff"));
console.log("buildCallOverrides knowledge base only: ok");
