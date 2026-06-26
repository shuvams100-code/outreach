// Export tenant-0's leads to a CSV file (optionally filter by state).
//   npm run export                 → all leads → leads-export.csv
//   npm run export -- scrubbed     → only ready-to-call leads
import { existsSync, writeFileSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { exportLeads } from "../src/export";

const TENANT0_ID = "00000000-0000-0000-0000-000000000000";
const state = process.argv[2];

const csv = await exportLeads(TENANT0_ID, state);
const rows = csv ? csv.split("\n").length - 1 : 0;
const out = "leads-export.csv";
writeFileSync(out, csv, "utf8");
console.log(`Exported ${rows} lead(s)${state ? ` (state=${state})` : ""} → ${out}`);
