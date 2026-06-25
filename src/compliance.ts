import { supabase } from "./lib/supabase";

// Pure helper — separated so it can be unit-tested without a DB.
export function isBlockedPhone(phone: string, blockedSet: Set<string>): boolean {
  return blockedSet.has(phone);
}

// Move all `enriched` leads for an account through the compliance gate:
// - phone on opt-out list → disqualified
// - phone clean → scrubbed (cleared to be called)
export async function scrubAccount(accountId: string): Promise<{
  processed: number;
  scrubbed: number;
  disqualified: number;
  errors: number;
}> {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, phone")
    .eq("account_id", accountId)
    .eq("state", "enriched");
  if (error) throw new Error(`Fetch leads failed: ${error.message}`);
  if (!leads?.length) return { processed: 0, scrubbed: 0, disqualified: 0, errors: 0 };

  const { data: optOuts, error: ooErr } = await supabase
    .from("opt_outs")
    .select("phone")
    .eq("account_id", accountId);
  if (ooErr) throw new Error(`Fetch opt_outs failed: ${ooErr.message}`);

  const blocked = new Set(
    (optOuts ?? []).map(o => o.phone).filter(Boolean) as string[],
  );

  let scrubbed = 0, disqualified = 0, errors = 0;
  for (const lead of leads) {
    try {
      const newState = isBlockedPhone(lead.phone, blocked) ? "disqualified" : "scrubbed";
      const { error: upErr } = await supabase
        .from("leads")
        .update({ state: newState })
        .eq("id", lead.id);
      if (upErr) throw new Error(upErr.message);
      if (newState === "scrubbed") scrubbed++;
      else disqualified++;
    } catch (e) {
      console.error(`Lead ${lead.id} scrub failed:`, e);
      errors++;
    }
  }

  return { processed: leads.length, scrubbed, disqualified, errors };
}
