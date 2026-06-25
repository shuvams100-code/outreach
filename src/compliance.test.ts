import assert from "node:assert/strict";
import { isBlockedPhone } from "./compliance";

const blocked = new Set(["+15125551111", "+17135552222"]);

assert.equal(isBlockedPhone("+15125551111", blocked), true);    // on list → blocked
assert.equal(isBlockedPhone("+15125553333", blocked), false);   // not on list → clean
assert.equal(isBlockedPhone("+15125551111", new Set()), false); // empty list → clean
console.log("isBlockedPhone: ok");
