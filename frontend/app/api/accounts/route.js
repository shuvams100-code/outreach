import { supabase } from "../../../../src/lib/supabase";
import { toClientShape, fromOnboardingInput } from "../_lib/accountShape";

export async function GET() {
  const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: true });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, clients: data.map(toClientShape) });
}

export async function POST(req) {
  const body = await req.json();
  if (!body?.name?.trim()) return Response.json({ ok: false, error: "Business name is required." }, { status: 400 });

  const { data, error } = await supabase.from("accounts").insert(fromOnboardingInput(body)).select("*").single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, client: toClientShape(data) });
}
