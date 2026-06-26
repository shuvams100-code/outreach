// List or apply use-case presets.
//   npm run preset                          → list available presets
//   npm run preset -- <presetKey> <account> → apply a preset to an account
// (account id is REQUIRED for apply — so tenant-0's tuned config is never clobbered by accident.)
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { listPresets, applyPreset } from "../src/presets";

const presetKey = process.argv[2];
const accountId = process.argv[3];

if (!presetKey) {
  console.log("Available presets:");
  for (const p of listPresets()) console.log(`  ${p.key}  (${p.direction})  — ${p.label}: ${p.description}`);
  console.log("\nApply:  npm run preset -- <presetKey> <accountId>");
  process.exit(0);
}
if (!accountId) { console.error("Account id required to apply a preset:  npm run preset -- <presetKey> <accountId>"); process.exit(1); }

const r = await applyPreset(accountId, presetKey);
console.log(`Applied "${r.applied}" → account ${accountId}`);
console.log(`  endings: [${r.enabled_tools.join(", ")}] · scraping: ${r.scraping ? "on" : "off"}`);
console.log("Still to fill (client-specific): phone number, calendar, knowledge base, ICP.");
