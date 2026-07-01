import { supabase } from "../../../../src/lib/supabase";

export async function GET() {
  const { count, error } = await supabase.from("accounts").select("id", { count: "exact", head: true });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, accountCount: count });
}
