import { supabase } from "./lib/supabase";

const ACTOR = "compass~crawler-google-places"; // Google Maps Scraper
const MAX_PLACES = 50; // ponytail: fixed cap; move to the accounts table if tenants ever need different volumes

export type Place = {
  title?: string;
  phone?: string;
  phoneUnformatted?: string; // E.164-ish, better for dialing
  address?: string;
  city?: string;
  state?: string;
  [k: string]: unknown;
};

// Pure: turn scraped places into lead rows, dropping no-phone places and any phone
// already seen (both already-in-DB and duplicates within this same batch).
export function selectNewLeads(places: Place[], accountId: string, existingPhones: Set<string>) {
  const seen = new Set(existingPhones);
  const rows = [];
  let noPhone = 0;
  let dup = 0;
  for (const p of places) {
    const phone = p.phoneUnformatted ?? p.phone;
    if (!phone) {
      noPhone++;
      continue;
    }
    if (seen.has(phone)) {
      dup++;
      continue;
    }
    seen.add(phone);
    rows.push({
      account_id: accountId,
      business_name: p.title ?? null,
      phone,
      address: p.address ?? null,
      city: p.city ?? null,
      address_state: p.state ?? null,
      source: "google_maps",
      raw_data: p,
      state: "new" as const,
    });
  }
  return { rows, noPhone, dup };
}

// Read an account's targeting, run the Google Maps scraper, write fresh businesses as `new` leads.
export async function scrapeAccount(accountId: string) {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("Missing APIFY_TOKEN in .env");

  const { data: acct, error: acctErr } = await supabase
    .from("accounts")
    .select("search_query, geo_city, geo_state")
    .eq("id", accountId)
    .single();
  if (acctErr || !acct) throw new Error(`Account ${accountId} not found: ${acctErr?.message}`);

  const input = {
    searchStringsArray: [acct.search_query],
    locationQuery: `${acct.geo_city}, ${acct.geo_state}, USA`,
    maxCrawledPlacesPerSearch: MAX_PLACES,
    language: "en",
  };

  // One synchronous call: runs the actor and returns the dataset items in the response.
  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
  );
  if (!res.ok) throw new Error(`Apify run failed (${res.status}): ${await res.text()}`);
  const places = (await res.json()) as Place[];

  const { data: existing, error: exErr } = await supabase
    .from("leads")
    .select("phone")
    .eq("account_id", accountId);
  if (exErr) throw new Error(`Reading existing leads failed: ${exErr.message}`);
  // ponytail: in-memory phone set; fine until an account holds 100k+ leads
  const seen = new Set((existing ?? []).map((l) => l.phone).filter(Boolean) as string[]);

  const { rows, noPhone, dup } = selectNewLeads(places, accountId, seen);
  if (rows.length) {
    const { error: insErr } = await supabase.from("leads").insert(rows);
    if (insErr) throw new Error(`Insert failed: ${insErr.message}`);
  }

  return { scraped: places.length, inserted: rows.length, skippedDuplicates: dup, skippedNoPhone: noPhone };
}
