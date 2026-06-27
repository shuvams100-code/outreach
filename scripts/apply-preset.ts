// List or apply use-case presets (one or several, composed).
//   npm run preset                                  → list presets, grouped by category
//   npm run preset -- <keys> <accountId>            → apply preset(s) to an account
//     <keys> can be one (outbound_sales) or several comma-separated (inbound_receptionist,outbound_sales)
// (account id is REQUIRED for apply — so tenant-0's tuned config is never clobbered by accident.)
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import { listPresets, applyPreset } from "../src/presets";

const keysArg = process.argv[2];
const accountId = process.argv[3];

if (!keysArg) {
  console.log("Available presets (pick one or several):\n");
  for (const cat of ["outbound", "inbound", "data", "custom"]) {
    console.log(`  [${cat}]`);
    for (const p of listPresets().filter((p) => p.category === cat)) console.log(`    ${p.key} — ${p.label}: ${p.description}`);
  }
  console.log("\nApply one:       npm run preset -- outbound_sales <accountId>");
  console.log("Apply several:   npm run preset -- inbound_receptionist,outbound_sales <accountId>");
  process.exit(0);
}
if (!accountId) { console.error("Account id required:  npm run preset -- <keys> <accountId>"); process.exit(1); }

const keys = keysArg.split(",").map((k) => k.trim()).filter(Boolean);
const r = await applyPreset(accountId, keys);
console.log(`Applied [${r.applied.join(" + ")}] → account ${accountId}`);
console.log(`  endings: [${(r.enabled_tools as string[]).join(", ") || "(none — manual)"}] · scraping: ${r.scraping ? "on" : "off"}`);
console.log("Still to fill (client-specific): phone number, calendar, knowledge base, ICP.");
