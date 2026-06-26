import { supabase } from "./lib/supabase";

// Pure (unit-tested): rows → CSV text, quoting cells that contain commas/quotes/newlines.
export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return "";
  const cols = columns ?? Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

const COLUMNS = ["business_name", "first_name", "last_name", "phone", "email", "city", "address_state", "state", "source", "captured_data"];

// Export an account's leads (optionally filtered by state) as CSV text.
export async function exportLeads(accountId: string, state?: string): Promise<string> {
  let q = supabase.from("leads").select(COLUMNS.join(",")).eq("account_id", accountId);
  if (state) q = q.eq("state", state);
  const { data, error } = await q.order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r: any) => ({ ...r, captured_data: r.captured_data ? JSON.stringify(r.captured_data) : "" }));
  return toCsv(rows, COLUMNS);
}
