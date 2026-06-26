import assert from "node:assert/strict";
import { toCsv } from "./export";

// empty → empty string
assert.equal(toCsv([]), "");

// basic rows, fixed columns
const csv = toCsv(
  [
    { name: "A Co", phone: "+15125551111", note: "plain" },
    { name: "B, Inc", phone: "+15125552222", note: 'has "quote"' },
  ],
  ["name", "phone", "note"],
);
const lines = csv.split("\n");
assert.equal(lines[0], "name,phone,note");
assert.equal(lines[1], "A Co,+15125551111,plain");
assert.equal(lines[2], '"B, Inc",+15125552222,"has ""quote"""'); // comma + quotes escaped
console.log("toCsv: ok");
