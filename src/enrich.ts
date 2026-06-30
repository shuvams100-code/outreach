import { supabase } from "./lib/supabase";
import { logCost } from "./costs";

// --- area code → IANA timezone (US only; free static lookup) ---
const ET = "America/New_York";
const CT = "America/Chicago";
const MT = "America/Denver";
const AZ = "America/Phoenix"; // no DST
const PT = "America/Los_Angeles";
const AK = "America/Anchorage";
const HI = "Pacific/Honolulu";

// ponytail: ~330 US area codes from NANP + state timezone assignments. Add new overlays here.
const AREA_TZ: Record<string, string> = {
  // Eastern
  "201":ET,"202":ET,"203":ET,"207":ET,"212":ET,"215":ET,"216":ET,"220":ET,
  "223":ET,"229":ET,"231":ET,"234":ET,"239":ET,"240":ET,"248":ET,"252":ET,
  "260":ET,"267":ET,"269":ET,"272":ET,"276":ET,"301":ET,"302":ET,"304":ET,
  "305":ET,"313":ET,"315":ET,"321":ET,"330":ET,"332":ET,"336":ET,"339":ET,
  "347":ET,"351":ET,"352":ET,"380":ET,"386":ET,"401":ET,"404":ET,"407":ET,
  "410":ET,"412":ET,"413":ET,"419":ET,"423":ET,"434":ET,"440":ET,"443":ET,
  "445":ET,"448":ET,"463":ET,"470":ET,"475":ET,"478":ET,"484":ET,"508":ET,
  "513":ET,"516":ET,"517":ET,"518":ET,"540":ET,"551":ET,"561":ET,"567":ET,
  "570":ET,"571":ET,"574":ET,"585":ET,"586":ET,"603":ET,"607":ET,"609":ET,
  "610":ET,"614":ET,"616":ET,"617":ET,"631":ET,"640":ET,"646":ET,"667":ET,
  "678":ET,"680":ET,"681":ET,"689":ET,"703":ET,"704":ET,"706":ET,"716":ET,
  "717":ET,"718":ET,"724":ET,"727":ET,"732":ET,"734":ET,"740":ET,"743":ET,
  "754":ET,"757":ET,"762":ET,"765":ET,"770":ET,"772":ET,"774":ET,"781":ET,
  "786":ET,"802":ET,"803":ET,"804":ET,"810":ET,"812":ET,"813":ET,"814":ET,
  "828":ET,"835":ET,"838":ET,"839":ET,"843":ET,"845":ET,"848":ET,"854":ET,
  "856":ET,"857":ET,"860":ET,"862":ET,"863":ET,"864":ET,"865":ET,"878":ET,
  "904":ET,"908":ET,"910":ET,"914":ET,"917":ET,"919":ET,"929":ET,"930":ET,
  "934":ET,"937":ET,"941":ET,"947":ET,"954":ET,"959":ET,"973":ET,"978":ET,
  "980":ET,"984":ET,"989":ET,
  // Central
  "205":CT,"210":CT,"214":CT,"217":CT,"218":CT,"219":CT,"224":CT,"225":CT,
  "228":CT,"251":CT,"254":CT,"256":CT,"262":CT,"281":CT,"308":CT,"309":CT,
  "312":CT,"314":CT,"316":CT,"318":CT,"319":CT,"320":CT,"325":CT,"331":CT,
  "334":CT,"337":CT,"346":CT,"361":CT,"402":CT,"405":CT,"409":CT,"414":CT,
  "417":CT,"430":CT,"432":CT,"447":CT,"464":CT,"469":CT,"479":CT,"501":CT,
  "504":CT,"507":CT,"512":CT,"515":CT,"531":CT,"534":CT,"539":CT,"563":CT,
  "573":CT,"580":CT,"601":CT,"605":CT,"608":CT,"612":CT,"615":CT,"618":CT,
  "620":CT,"629":CT,"630":CT,"636":CT,"641":CT,"651":CT,"659":CT,"660":CT,
  "662":CT,"682":CT,"701":CT,"708":CT,"712":CT,"713":CT,"715":CT,"726":CT,
  "731":CT,"737":CT,"763":CT,"769":CT,"773":CT,"779":CT,"785":CT,"806":CT,
  "815":CT,"816":CT,"817":CT,"830":CT,"832":CT,"847":CT,"850":CT,"870":CT,
  "872":CT,"901":CT,"903":CT,"906":CT,"913":CT,"918":CT,"920":CT,"931":CT,
  "936":CT,"938":CT,"940":CT,"952":CT,"956":CT,"972":CT,"979":CT,"985":CT,
  // Mountain
  "208":MT,"303":MT,"307":MT,"385":MT,"406":MT,"435":MT,"505":MT,"575":MT,
  "719":MT,"720":MT,"801":MT,"915":MT,"970":MT,
  // Arizona (no DST)
  "480":AZ,"520":AZ,"602":AZ,"623":AZ,"928":AZ,
  // Pacific
  "206":PT,"209":PT,"213":PT,"253":PT,"279":PT,"310":PT,"323":PT,"341":PT,
  "360":PT,"408":PT,"415":PT,"424":PT,"425":PT,"442":PT,"458":PT,"503":PT,
  "509":PT,"510":PT,"530":PT,"541":PT,"559":PT,"562":PT,"619":PT,"626":PT,
  "628":PT,"650":PT,"657":PT,"661":PT,"669":PT,"702":PT,"707":PT,"714":PT,
  "725":PT,"747":PT,"760":PT,"775":PT,"805":PT,"818":PT,"820":PT,"831":PT,
  "858":PT,"909":PT,"916":PT,"925":PT,"949":PT,"951":PT,"971":PT,
  // Alaska / Hawaii
  "907":AK,"808":HI,
};

export function timezoneFromPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  const area = digits.length === 11 && digits[0] === "1" ? digits.slice(1, 4) : digits.slice(0, 3);
  return AREA_TZ[area] ?? null;
}

// State abbreviation → primary IANA timezone. Used when a physical address state is known, since a
// mobile number from NY can ring someone living in CA — physical address wins over area code.
// ponytail: states that span zones (IN, KY, TN, ND, SD, NE, KS, TX) use the majority-population zone.
const STATE_TZ: Record<string, string> = {
  AL: CT, AK: AK, AZ: AZ, AR: CT, CA: PT, CO: MT, CT: ET, DE: ET, FL: ET,
  GA: ET, HI: HI, ID: MT, IL: CT, IN: ET, IA: CT, KS: CT, KY: ET, LA: CT,
  ME: ET, MD: ET, MA: ET, MI: ET, MN: CT, MS: CT, MO: CT, MT: MT, NE: CT,
  NV: PT, NH: ET, NJ: ET, NM: MT, NY: ET, NC: ET, ND: CT, OH: ET, OK: CT,
  OR: PT, PA: ET, RI: ET, SC: ET, SD: CT, TN: CT, TX: CT, UT: MT, VT: ET,
  VA: ET, WA: PT, WV: ET, WI: CT, WY: MT, DC: ET,
};

export function timezoneFromState(state: string | null | undefined): string | null {
  if (!state) return null;
  return STATE_TZ[state.trim().toUpperCase()] ?? null;
}

// ---- network helpers ----

async function fetchSiteText(url: string): Promise<string | null> {
  try {
    // Many scraped/uploaded sites lack a protocol ("acme.com") — fetch() throws on those. Prepend https.
    const full = url.includes("://") ? url : "https://" + url;
    const res = await fetch(full, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000);
  } catch {
    return null;
  }
}

export function extractEmail(text: string): string | null {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m?.[0] ?? null;
}

// Free OpenRouter models, verified 200 via scripts/probe-llm.ts (2026-06-25).
// Two different providers so one being 429-rate-limited rolls to the other.
// ponytail: re-run the probe and swap IDs here if they ever 404/429 permanently.
const LLM_MODELS_FREE = [
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
];
// Paid fallback: only used when ALL free models are rate-limited on both passes.
const LLM_MODEL_PAID = "openai/gpt-4o-mini";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// gpt-oss sometimes wraps JSON in prose/fences despite response_format — pull the {...} block.
function parseJsonLoose(content: string): LLMProfile | null {
  try {
    return JSON.parse(content) as LLMProfile;
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as LLMProfile;
    } catch {
      return null;
    }
  }
}

type LLMProfile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  business_profile: string | null;
  fits_icp: boolean;
};

// `icpDescription` is the account's definition of a good lead (per-account, never hardcoded).
// When absent, every business is kept (fits_icp defaults true) — no filtering.
async function callLLM(text: string, businessName: string, icpDescription?: string | null): Promise<LLMProfile | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const icpLine = icpDescription
    ? `\nWe are looking for leads matching this profile (the account's ideal customer): ${icpDescription}`
    : "";
  const fitsRule = icpDescription
    ? `true if this business matches the profile above, false if it clearly does not`
    : `always true (no filtering configured)`;

  const prompt = `Analyze this business text and return ONLY valid JSON — no markdown, no extra text.
Business name: ${businessName}${icpLine}
Content: ${text}

Return this exact JSON shape:
{
  "first_name": first name of a key person found in the text, or null,
  "last_name": last name of a key person found in the text, or null,
  "email": email address found in the text, or null,
  "business_profile": "2-4 sentences: what they do, who they serve, their specialties, and a compelling talking angle for a cold call",
  "fits_icp": ${fitsRule}
}`;

  const tryModel = async (model: string) => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://outreach.ai" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
      signal: AbortSignal.timeout(25000),
    });
    return res;
  };

  // Two passes on free models: pass 0 tries all; if all 429, short backoff then pass 1.
  for (let pass = 0; pass < 2; pass++) {
    let all429 = true;
    for (const model of LLM_MODELS_FREE) {
      try {
        const res = await tryModel(model);
        if (res.status === 429) continue;
        all429 = false;
        if (!res.ok) continue;
        const data = await res.json() as { choices?: { message?: { content?: string } }[] };
        const content = data.choices?.[0]?.message?.content;
        if (!content) continue;
        const parsed = parseJsonLoose(content);
        if (parsed) return parsed;
      } catch {
        all429 = false;
        continue;
      }
    }
    if (pass === 0 && all429) await sleep(4000);
    else break;
  }

  // Paid fallback: free models exhausted — use a cheap paid model rather than lose the lead.
  try {
    const res = await tryModel(LLM_MODEL_PAID);
    if (res.ok) {
      const data = await res.json() as { choices?: { message?: { content?: string } }[] };
      const content = data.choices?.[0]?.message?.content;
      if (content) return parseJsonLoose(content);
    }
  } catch { /* paid model also failed — return null below */ }

  return null;
}

async function tavilySearch(businessName: string, city: string, state: string): Promise<string | null> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        // Generic business lookup — no industry hardcoded (the ICP filtering happens in the LLM step).
        query: `"${businessName}" ${city} ${state} company business`,
        max_results: 3,
        include_answer: true,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { answer?: string; results?: { content: string }[] };
    if (data.answer) return data.answer;
    if (data.results?.length) return data.results.map(r => r.content).join(" ").slice(0, 4000);
    return null;
  } catch {
    return null;
  }
}

// ---- public API ----

type Lead = {
  id: string;
  business_name: string | null;
  phone: string;
  city: string | null;
  address_state: string | null;
  raw_data: Record<string, unknown> | null;
};

export type EnrichUpdate = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  business_profile: string | null;
  timezone: string | null;
  state: "enriched" | "disqualified";
};

// Returns the update to apply, or null when NO rung produced data — caller leaves the
// lead `new` so a re-run retries it (never fake-mark it `enriched` on empty results).
// `icpDescription` (per-account) decides what counts as a fitting lead — no industry hardcoded.
export async function enrichLead(lead: Lead, icpDescription?: string | null, accountId?: string): Promise<EnrichUpdate | null> {
  // Physical address state is more reliable than area code for mobile numbers (1.2).
  const timezone = timezoneFromState(lead.address_state) ?? timezoneFromPhone(lead.phone);
  const website = (lead.raw_data?.website as string | null | undefined) ?? null;
  let profile: LLMProfile | null = null;

  // Rung 1 (regex email) + Rung 2 (LLM): works when a website is present
  if (website) {
    const text = await fetchSiteText(website);
    if (text) {
      const email = extractEmail(text);
      const llm = await callLLM(text, lead.business_name ?? "", icpDescription);
      if (llm) {
        profile = { ...llm, email: email ?? llm.email };
        if (accountId) {
          await logCost(accountId, "openrouter", 0.003, `LLM profile check for ${lead.business_name} (website)`);
        }
      }
    }
  }

  // Rung 3 (Tavily): fires when site is missing or LLM returned no profile
  if (!profile?.business_profile) {
    const tavilyText = await tavilySearch(
      lead.business_name ?? "",
      lead.city ?? "",
      lead.address_state ?? "",
    );
    if (tavilyText) {
      if (accountId) {
        await logCost(accountId, "tavily", 0.01, `Tavily search for ${lead.business_name}`);
      }
      const llm = await callLLM(tavilyText, lead.business_name ?? "", icpDescription);
      if (llm) {
        profile = profile ? { ...profile, ...llm } : llm;
        if (accountId) {
          await logCost(accountId, "openrouter", 0.003, `LLM profile check for ${lead.business_name} (Tavily fallback)`);
        }
      }
    }
  }

  // No rung produced anything → genuine failure. Leave `new`, don't dress it up as enriched.
  if (!profile) return null;

  const fitsIcp = profile.fits_icp ?? true;
  return {
    email: profile.email ?? null,
    first_name: profile.first_name ?? null,
    last_name: profile.last_name ?? null,
    business_profile: profile.business_profile ?? null,
    timezone,
    state: fitsIcp ? "enriched" : "disqualified",
  };
}

export async function enrichAccount(accountId: string): Promise<{
  processed: number;
  enriched: number;
  disqualified: number;
  failed: number;
  errors: number;
}> {
  // The account's ICP (per-account; null = keep everything) drives the fit decision.
  const { data: acct } = await supabase.from("accounts").select("icp_description, target_customer_type").eq("id", accountId).single();

  // LEGAL GATE: enrichment (researching each lead online) is only for B2B. For consumer audiences — or
  // any account not explicitly 'business' — we never enrich individuals. Authoritative engine-side guard.
  if (acct?.target_customer_type !== "business") {
    console.log(`[enrich] account ${accountId} is not B2B (target_customer_type=${acct?.target_customer_type ?? "unset"}) — enrichment skipped (not permitted for consumer audiences).`);
    return { processed: 0, enriched: 0, disqualified: 0, failed: 0, errors: 0 };
  }

  const icp = acct?.icp_description ?? null;

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, business_name, phone, city, address_state, raw_data")
    .eq("account_id", accountId)
    .eq("state", "new");
  if (error) throw new Error(`Fetch leads failed: ${error.message}`);

  const total = leads?.length ?? 0;
  let enriched = 0, disqualified = 0, failed = 0, errors = 0, i = 0;
  for (const lead of leads ?? []) {
    i++;
    const name = (lead as Lead).business_name ?? "(no name)";
    try {
      const update = await enrichLead(lead as Lead, icp, accountId);
      if (!update) {
        failed++;
        console.log(`[${i}/${total}] ${name} → failed (no data; left as new)`);
        continue;
      }
      const { error: upErr } = await supabase
        .from("leads")
        .update(update)
        .eq("id", lead.id);
      if (upErr) throw new Error(upErr.message);
      if (update.state === "enriched") {
        enriched++;
        console.log(`[${i}/${total}] ${name} → enriched`);
      } else {
        disqualified++;
        console.log(`[${i}/${total}] ${name} → disqualified (does not fit ICP)`);
      }
    } catch (e) {
      errors++;
      console.log(`[${i}/${total}] ${name} → error: ${(e as Error).message}`);
    }
  }
  return { processed: total, enriched, disqualified, failed, errors };
}
