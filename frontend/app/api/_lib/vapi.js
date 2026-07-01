const VAPI_BASE = "https://api.vapi.ai";

function vapiKey() {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error("Missing VAPI_API_KEY");
  return key;
}

// List every phone number on this VAPI org (not scoped per-account — VAPI has no concept of our
// accounts; assignment to a client is tracked via accounts.vapi_phone_numbers).
export async function listVapiPhoneNumbers() {
  const res = await fetch(`${VAPI_BASE}/phone-number`, { headers: { Authorization: `Bearer ${vapiKey()}` } });
  if (!res.ok) throw new Error(`VAPI list phone numbers failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// Buy a new VAPI-hosted number in the given area code. Confirmed against VAPI's real API 2026-07-01:
// provider "vapi" (no Twilio — matches the locked decision) needs numberDesiredAreaCode. This has a
// REAL cost — never call this without the user explicitly choosing to buy a number.
export async function buyVapiPhoneNumber(areaCode) {
  const res = await fetch(`${VAPI_BASE}/phone-number`, {
    method: "POST",
    headers: { Authorization: `Bearer ${vapiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "vapi", numberDesiredAreaCode: areaCode }),
  });
  if (!res.ok) throw new Error(`VAPI buy phone number failed (${res.status}): ${await res.text()}`);
  return res.json();
}
