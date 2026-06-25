import { uploadFile } from "../src/upload";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const path = process.argv[2];
if (!path) {
  console.error("Usage: npm run upload -- <path-to-csv>");
  console.error("Example: npm run upload -- scripts/sample-contacts.csv");
  process.exit(1);
}

const r = await uploadFile(TENANT0_ID, path);
console.log(
  `Upload done — ${r.parsed} rows read · ${r.inserted} added ` +
    `(${r.ready} ready to call · ${r.blocked} on opt-out) · ` +
    `${r.dup} dup · ${r.skippedNoPhone} no-phone`,
);
