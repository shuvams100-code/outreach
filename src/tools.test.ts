import assert from "node:assert/strict";
import { parseToolCalls, resolveAccountId, toolResponse } from "./tools";

// --- parseToolCalls: arguments as an object + outbound metadata ---
let p = parseToolCalls({
  message: {
    type: "tool-calls",
    toolCallList: [{ id: "c1", function: { name: "book_appointment", arguments: { start: "2026-07-02T19:30:00.000Z" } } }],
    call: { id: "vc1", metadata: { account_id: "acc-9", lead_id: "lead-7" } },
  },
});
assert.equal(p.calls.length, 1);
assert.equal(p.calls[0].name, "book_appointment");
assert.equal(p.calls[0].args.start, "2026-07-02T19:30:00.000Z");
assert.equal(p.accountIdHint, "acc-9");
assert.equal(p.leadId, "lead-7");
assert.equal(p.vapiCallId, "vc1");
console.log("parseToolCalls outbound metadata: ok");

// --- arguments as a JSON string + inbound phoneNumberId, no metadata ---
p = parseToolCalls({
  message: {
    toolCallList: [{ id: "c2", function: { name: "check_availability", arguments: '{"foo":"bar"}' } }],
    call: { id: "vc2", phoneNumberId: "pn-123" },
  },
});
assert.equal(p.calls[0].args.foo, "bar");
assert.equal(p.accountIdHint, null);
assert.equal(p.phoneNumberId, "pn-123");
console.log("parseToolCalls inbound number: ok");

// --- empty / malformed body doesn't throw ---
assert.deepEqual(parseToolCalls({}).calls, []);
assert.deepEqual(parseToolCalls(null).calls, []);
assert.equal(parseToolCalls({}).accountIdHint, null);
console.log("parseToolCalls empty: ok");

// --- resolveAccountId: metadata hint wins, no DB touched ---
assert.equal(await resolveAccountId({ accountIdHint: "acc-9", phoneNumberId: null }), "acc-9");
console.log("resolveAccountId hint wins: ok");

// --- resolveAccountId: nothing to go on → opt-in dev default, else null (no silent prod fallback) ---
const saved = process.env.DEFAULT_ACCOUNT_ID;
delete process.env.DEFAULT_ACCOUNT_ID;
assert.equal(await resolveAccountId({ accountIdHint: null, phoneNumberId: null }), null);
process.env.DEFAULT_ACCOUNT_ID = "dev-default";
assert.equal(await resolveAccountId({ accountIdHint: null, phoneNumberId: null }), "dev-default");
if (saved === undefined) delete process.env.DEFAULT_ACCOUNT_ID; else process.env.DEFAULT_ACCOUNT_ID = saved;
console.log("resolveAccountId default/refuse: ok");

// --- toolResponse envelope ---
assert.deepEqual(
  toolResponse([{ toolCallId: "c1", result: "Booked" }]),
  { results: [{ toolCallId: "c1", result: "Booked" }] },
);
console.log("toolResponse: ok");
