import { supabase } from "./lib/supabase";
import { normalizePhone } from "./upload";
import { timezoneFromPhone } from "./enrich";

// Web-form capture: the client points their form / Typeform / website at /webhook/leads/<token>.
// Each submission becomes a `new`/`scrubbed` lead for that account — same pipeline as upload/scrape.
// 2026-07-02: the "speed-to-lead" auto-call that used to fire here on submission was removed — a
// web-form lead has no TCPA consent basis for an AI-voice call any more than a scraped one does.

const pick = (o: Record<string, any>, keys: string[]): string | null => {
  for (const k of Object.keys(o)) {
    if (keys.includes(k.toLowerCase().trim()) && o[k]) return String(o[k]).trim();
  }
  return null;
};

// Pure (unit-tested): map one submission body → a lead row, or null if there's no usable phone.
// Flexible keys so most form tools work with no config.
export function mapWebformLead(body: Record<string, any>, accountId: string) {
  const b = body ?? {};
  const phone = normalizePhone(pick(b, ["phone", "phone_number", "phonenumber", "mobile", "cell", "tel", "telephone"]));
  if (!phone) return null;

  let first = pick(b, ["first_name", "firstname", "first"]);
  let last = pick(b, ["last_name", "lastname", "last"]);
  const full = pick(b, ["name", "full_name", "fullname"]);
  if (!first && full) {
    const parts = full.split(/\s+/);
    first = parts[0];
    last = last ?? (parts.slice(1).join(" ") || null);
  }
  const website = pick(b, ["website", "url", "site"]);

  return {
    account_id: accountId,
    first_name: first,
    last_name: last,
    business_name: pick(b, ["company", "business", "business_name", "organization"]),
    email: pick(b, ["email", "email_address", "e-mail"]),
    phone,
    timezone: timezoneFromPhone(phone),
    source: "web_form",
    raw_data: website ? { ...b, website } : b,
  };
}

// Receive one submission: resolve account by token, dedupe by phone, insert. Returns a small result.
export async function handleWebform(token: string, body: Record<string, any>): Promise<{ ok: boolean; reason?: string; leadId?: string }> {
  if (!token) return { ok: false, reason: "missing token" };
  const { data: acct } = await supabase
    .from("accounts")
    .select("id, enrichment_enabled")
    .eq("webhook_token", token)
    .maybeSingle();
  if (!acct) return { ok: false, reason: "unknown token" };

  const lead = mapWebformLead(body, acct.id);
  if (!lead) return { ok: false, reason: "no usable phone in submission" };

  // Already have this phone? Treat as success (idempotent) — never create a duplicate.
  const { data: dupe } = await supabase
    .from("leads").select("id").eq("account_id", acct.id).eq("phone", lead.phone).maybeSingle();
  if (dupe) return { ok: true, reason: "duplicate (ignored)", leadId: dupe.id };

  // JIT DNC check: webform skips the enrichment/scrub pipeline, so check opt_outs directly.
  const { data: optOut } = await supabase
    .from("opt_outs").select("id").eq("account_id", acct.id).eq("phone", lead.phone).maybeSingle();
  const state = optOut
    ? "disqualified"
    : acct.enrichment_enabled && (lead.raw_data as Record<string, unknown>)?.website
    ? "new"
    : "scrubbed";

  const { data: inserted, error } = await supabase
    .from("leads").insert({ ...lead, state }).select("id").single();
  if (error) return { ok: false, reason: error.message };

  return { ok: true, leadId: inserted.id };
}
