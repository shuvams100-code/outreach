import { supabase } from "./lib/supabase";
import { normalizePhone } from "./upload";
import { timezoneFromPhone } from "./enrich";
import { deriveSearchTerm } from "./icp";
import { logCost } from "./costs";

// Multi-source lead scraping. Each source is one Apify actor + a small adapter (how to call it).
// The engine runs whatever the account has toggled on in `sources` and dedupes across all of them
// plus everything already in the database — so a lead never gets pulled or contacted twice.
// Adding a source later = add one entry here; the dashboard toggle just flips `enabled` in `sources`.

type RawItem = Record<string, unknown>;
export type Targeting = { search_query: string | null; geo_city: string | null; geo_state: string | null };
type SourceAdapter = {
  actor: string;
  buildInput: (t: Targeting, max: number) => Record<string, unknown>;
  isAd?: (item: RawItem) => boolean;
};

const loc = (t: Targeting) => [t.geo_city, t.geo_state].filter(Boolean).join(", ");

// ponytail: 3 universal sources (work for any client category). Niche directories get added per-client
// later. Only field mapping below is shared; each adapter just shapes that actor's input.
export const ADAPTERS: Record<string, SourceAdapter> = {
  google_maps: {
    actor: "compass~crawler-google-places",
    buildInput: (t, max) => ({
      searchStringsArray: [t.search_query],
      locationQuery: [t.geo_city, t.geo_state, "USA"].filter(Boolean).join(", "),
      maxCrawledPlacesPerSearch: max,
      language: "en",
    }),
    isAd: (i) => i.isAdvertisement === true, // confirmed via probe: Maps flags ads as `isAdvertisement`
  },
  yellow_pages: {
    actor: "trudax~yellow-pages-us-scraper",
    buildInput: (t, max) => ({ search: t.search_query, location: loc(t), maxItems: max }),
    isAd: (i) => i.isAd === true, // confirmed via probe: ad rows (e.g. national carriers) flagged here
  },
  hotfrog: {
    actor: "crawlerbros~hotfrog-scraper",
    buildInput: (t, max) => ({ mode: "search", searchQuery: t.search_query, location: loc(t), maxItems: max }),
  },
  // ponytail: Manta dropped — its `category` is a fixed enum (financial_services, …), not a free-text
  // search, so it can't target a niche and would waste budget. These 3 sources are the universal,
  // platform-standard set — same for every client, toggled on/off in `sources`, never customized per client.
};

// ---- defensive field mapping (output field names vary per actor; confirm with probe-source) ----

const field = (o: RawItem, keys: string[]): string | null => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return null;
};
const NAME_KEYS = ["name", "title", "businessName", "companyName"];
const PHONE_KEYS = ["phoneUnformatted", "phone", "phoneNumber", "telephone"]; // phoneUnformatted is E.164-ish
const WEBSITE_KEYS = ["website", "websiteUrl", "businessWebsite"]; // NOT "url" — that's often a listing page
const EMAIL_KEYS = ["email", "emailAddress"];
const ADDR_KEYS = ["address", "fullAddress", "streetAddress", "street"];
const CITY_KEYS = ["city", "locality"];
const STATE_KEYS = ["state", "region", "stateProvince"];

// Host of a URL, lowercased, www-stripped — the dedup key for "same business, different phone number".
export function normalizeDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = url.includes("://") ? url : "https://" + url;
    const host = new URL(u).hostname.toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

// Pure: turn scraped items into `new` lead rows. Drops ads + no-phone rows, and skips any lead whose
// phone OR website-domain is already seen (in the DB or earlier in this run). `seenPhones`/`seenDomains`
// are shared across sources, so the same business from two sources is caught even with different numbers.
export function selectNewLeads(
  items: RawItem[],
  accountId: string,
  seenPhones: Set<string>,
  seenDomains: Set<string>,
  sourceKey: string,
  isAd?: (i: RawItem) => boolean,
) {
  const rows = [];
  let noPhone = 0, dup = 0, ads = 0;

  for (const l of items) {
    if (isAd?.(l)) { ads++; continue; }
    const phone = normalizePhone(field(l, PHONE_KEYS));
    if (!phone) { noPhone++; continue; }

    const website = field(l, WEBSITE_KEYS);
    const domain = normalizeDomain(website);
    if (seenPhones.has(phone) || (domain && seenDomains.has(domain))) { dup++; continue; }
    seenPhones.add(phone);
    if (domain) seenDomains.add(domain);

    rows.push({
      account_id: accountId,
      business_name: field(l, NAME_KEYS),
      email: field(l, EMAIL_KEYS),
      phone,
      address: field(l, ADDR_KEYS),
      city: field(l, CITY_KEYS),
      address_state: field(l, STATE_KEYS),
      timezone: timezoneFromPhone(phone),
      source: sourceKey,
      raw_data: website ? { ...l, website } : l,
      state: "new" as const,
    });
  }
  return { rows, noPhone, dup, ads };
}

async function runSource(actor: string, input: Record<string, unknown>, token: string): Promise<RawItem[]> {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
  );
  if (!res.ok) throw new Error(`Apify run failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as RawItem[];
}

// Read an account's targeting + enabled sources, run each, dedupe across all + the DB, insert as `new`.
export async function scrapeAccount(accountId: string, maxItems?: number) {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("Missing APIFY_TOKEN in .env");

  const { data: acct, error: acctErr } = await supabase
    .from("accounts")
    .select("search_query, geo_city, geo_state, lead_cap_per_run, sources, icp_description, target_customer_type")
    .eq("id", accountId)
    .single();
  if (acctErr || !acct) throw new Error(`Account ${accountId} not found: ${acctErr?.message}`);

  // LEGAL GATE: scraping public data is only permitted for B2B accounts. Anything that isn't explicitly
  // 'business' (consumer, or unset) is refused — never scrape individuals' data. This is the authoritative
  // guard; the UI also hides the option, but the engine must never rely on that.
  if (acct.target_customer_type !== "business") {
    console.log(`[scrape] account ${accountId} is not B2B (target_customer_type=${acct.target_customer_type ?? "unset"}) — scraping skipped (not permitted for consumer audiences).`);
    return { skipped: "not a B2B account — scraping not permitted" as const };
  }

  // No search term set but an ICP is? Derive the term from the ICP and save it (one-time per account).
  if (!acct.search_query && acct.icp_description) {
    const term = await deriveSearchTerm(acct.icp_description);
    if (term) {
      acct.search_query = term;
      await supabase.from("accounts").update({ search_query: term }).eq("id", accountId);
    }
  }
  if (!acct.search_query) throw new Error("Account has no search_query and none could be derived from icp_description");

  const enabled = ((acct.sources as { key: string; enabled?: boolean }[]) ?? [])
    .filter((s) => s.enabled !== false)
    .map((s) => s.key)
    .filter((k) => k in ADAPTERS);
  const unknown = ((acct.sources as { key: string; enabled?: boolean }[]) ?? [])
    .filter((s) => s.enabled !== false && !(s.key in ADAPTERS))
    .map((s) => s.key);
  const max = maxItems ?? acct.lead_cap_per_run ?? 100;

  // Seed dedup sets from EVERYTHING already in the DB (any state) → never re-pull or re-contact.
  const { data: existing, error: exErr } = await supabase
    .from("leads").select("phone, raw_data").eq("account_id", accountId);
  if (exErr) throw new Error(`Reading existing leads failed: ${exErr.message}`);
  const seenPhones = new Set((existing ?? []).map((l) => l.phone).filter(Boolean) as string[]);
  const seenDomains = new Set<string>();
  for (const l of existing ?? []) {
    const d = normalizeDomain((l.raw_data as RawItem | null)?.website as string | null);
    if (d) seenDomains.add(d);
  }

  const allRows = [];
  const perSource: Record<string, unknown> = {};
  for (const key of enabled) {
    const adapter = ADAPTERS[key];
    try {
      const items = await runSource(adapter.actor, adapter.buildInput(acct, max), token);
      const { rows, noPhone, dup, ads } = selectNewLeads(items, accountId, seenPhones, seenDomains, key, adapter.isAd);
      allRows.push(...rows);
      perSource[key] = { scraped: items.length, inserted: rows.length, dup, noPhone, ads };
      const apifyCost = items.length * 0.005;
      if (apifyCost > 0) {
        await logCost(accountId, "apify", apifyCost, `Apify scrape for source "${key}" returned ${items.length} items`);
      }
    } catch (e: any) {
      perSource[key] = { error: e?.message ?? String(e) };
    }
  }

  if (allRows.length) {
    const { error: insErr } = await supabase.from("leads").insert(allRows);
    if (insErr) throw new Error(`Insert failed: ${insErr.message}`);
  }

  return { perSource, inserted: allRows.length, unknownSources: unknown };
}
