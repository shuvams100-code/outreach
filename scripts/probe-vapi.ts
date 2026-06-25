// One-shot check: confirm the VAPI key works + list our phone numbers (id + number).
// Throwaway — gives us the phone number ID the calling engine needs.
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");

const key = process.env.VAPI_API_KEY;
if (!key) { console.error("No VAPI_API_KEY in .env"); process.exit(1); }

const res = await fetch("https://api.vapi.ai/phone-number", {
  headers: { Authorization: `Bearer ${key}` },
});
console.log("HTTP", res.status);
if (!res.ok) { console.error("BODY:", await res.text()); process.exit(1); }

const nums = await res.json() as { id: string; number?: string; name?: string; status?: string }[];
console.log(`\n${nums.length} phone number(s):`);
for (const n of nums) {
  console.log(`  id=${n.id}  number=${n.number ?? "?"}  name=${n.name ?? "-"}  status=${n.status ?? "-"}`);
}
