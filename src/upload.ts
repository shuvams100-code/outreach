import { readFileSync } from "node:fs";
import { supabase } from "./lib/supabase";
import { timezoneFromPhone } from "./enrich";

// ---------- pure helpers (unit-tested, no network) ----------

// US phone → +1XXXXXXXXXX. null if it can't be made into a valid US number.
// ponytail: US-only for now; add international normalization when we expand past the US.
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d[0] === "1") return `+${d}`;
  return null;
}

// Split one CSV line, honoring quoted fields and "" escaped quotes.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// Parse CSV text → array of rows keyed by lowercased header.
// ponytail: doesn't handle newlines embedded inside quoted cells — fine for
//           name/phone/email lists; swap in `csv-parse` if real exports break it.
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? "").trim(); });
    return row;
  });
}

// Header variants we auto-map, so most exported lists work with no config.
// ponytail: when a client has odd headers, add a per-account upload_mapping column.
const KEYS = {
  first: ["first_name", "firstname", "first"],
  last: ["last_name", "lastname", "last"],
  name: ["name", "full_name", "fullname", "contact"],
  phone: ["phone", "phone_number", "phonenumber", "mobile", "cell", "number", "telephone"],
  email: ["email", "email_address", "e-mail"],
  company: ["company", "business", "business_name", "businessname", "organization", "agency"],
};

const pick = (row: Record<string, string>, keys: string[]): string | null => {
  for (const k of keys) if (row[k]) return row[k];
  return null;
};

export type ContactRow = {
  account_id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string;
  timezone: string | null;
  source: "upload";
  raw_data: Record<string, string>;
  state: "scrubbed" | "disqualified";
};

// Map raw CSV rows → contact rows: normalize phone, dedupe, opt-out check.
// Uploaded lists skip enrichment, so a clean number goes straight to `scrubbed`
// (cleared to call); a number on the opt-out list becomes `disqualified`.
export function selectUploadLeads(
  rows: Record<string, string>[],
  accountId: string,
  existingPhones: Set<string>,
  blocked: Set<string>,
) {
  const seen = new Set(existingPhones);
  const out: ContactRow[] = [];
  let skippedNoPhone = 0, dup = 0, blockedCount = 0;

  for (const r of rows) {
    const phone = normalizePhone(pick(r, KEYS.phone));
    if (!phone) { skippedNoPhone++; continue; }
    if (seen.has(phone)) { dup++; continue; }
    seen.add(phone);

    let first = pick(r, KEYS.first);
    let last = pick(r, KEYS.last);
    const full = pick(r, KEYS.name);
    if (!first && full) {
      const parts = full.split(/\s+/);
      first = parts[0];
      last = last ?? (parts.slice(1).join(" ") || null);
    }

    const isBlocked = blocked.has(phone);
    if (isBlocked) blockedCount++;
    out.push({
      account_id: accountId,
      first_name: first,
      last_name: last,
      business_name: pick(r, KEYS.company),
      email: pick(r, KEYS.email),
      phone,
      timezone: timezoneFromPhone(phone),
      source: "upload",
      raw_data: r,
      state: isBlocked ? "disqualified" : "scrubbed",
    });
  }
  return { rows: out, skippedNoPhone, dup, blocked: blockedCount };
}

// ---------- DB-facing entry point ----------

export async function uploadFile(accountId: string, csvPath: string) {
  const text = readFileSync(csvPath, "utf8");
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("CSV has no data rows (need a header row + at least one row).");

  const [{ data: existing, error: exErr }, { data: optOuts, error: ooErr }] = await Promise.all([
    supabase.from("leads").select("phone").eq("account_id", accountId),
    supabase.from("opt_outs").select("phone").eq("account_id", accountId),
  ]);
  if (exErr) throw new Error(`Reading existing leads failed: ${exErr.message}`);
  if (ooErr) throw new Error(`Reading opt_outs failed: ${ooErr.message}`);

  const existingPhones = new Set((existing ?? []).map((l) => l.phone).filter(Boolean) as string[]);
  const blocked = new Set((optOuts ?? []).map((o) => o.phone).filter(Boolean) as string[]);

  const { rows: contacts, skippedNoPhone, dup, blocked: blockedCount } =
    selectUploadLeads(rows, accountId, existingPhones, blocked);

  if (contacts.length) {
    const { error: insErr } = await supabase.from("leads").insert(contacts);
    if (insErr) throw new Error(`Insert failed: ${insErr.message}`);
  }

  return {
    parsed: rows.length,
    inserted: contacts.length,
    ready: contacts.length - blockedCount,
    blocked: blockedCount,
    dup,
    skippedNoPhone,
  };
}
