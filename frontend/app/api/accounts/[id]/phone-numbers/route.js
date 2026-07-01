import { supabase } from "../../../../../../src/lib/supabase";
import { buyVapiPhoneNumber } from "../../../_lib/vapi";

// Buy a real VAPI phone number for this client and assign it (by VAPI's own number id — NOT the raw
// digits) to accounts.vapi_phone_numbers, which resolveAccountId/placeCall already read for real
// inbound/outbound routing. This has a REAL cost on the VAPI account — the frontend must only call
// this from an explicit "Buy number" action the user clicks, never automatically.
export async function POST(req, { params }) {
  const { id } = await params;
  const { areaCode } = await req.json();
  if (!areaCode) return Response.json({ ok: false, error: "areaCode is required." }, { status: 400 });

  try {
    const bought = await buyVapiPhoneNumber(areaCode);
    const { data: acct, error: readErr } = await supabase.from("accounts").select("vapi_phone_numbers").eq("id", id).single();
    if (readErr || !acct) throw new Error(`Account ${id} not found: ${readErr?.message}`);

    const vapi_phone_numbers = [...(acct.vapi_phone_numbers ?? []), bought.id];
    const { error: updErr } = await supabase.from("accounts").update({ vapi_phone_numbers }).eq("id", id);
    if (updErr) throw new Error(updErr.message);

    return Response.json({ ok: true, number: bought });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// Unassign a number from this account (does NOT release/delete it from VAPI — just stops treating it
// as this client's; releasing the real number is a separate, deliberate action we don't automate here).
export async function DELETE(req, { params }) {
  const { id } = await params;
  const { phoneNumberId } = await req.json();
  if (!phoneNumberId) return Response.json({ ok: false, error: "phoneNumberId is required." }, { status: 400 });

  const { data: acct, error: readErr } = await supabase.from("accounts").select("vapi_phone_numbers").eq("id", id).single();
  if (readErr || !acct) return Response.json({ ok: false, error: `Account ${id} not found: ${readErr?.message}` }, { status: 404 });

  const vapi_phone_numbers = (acct.vapi_phone_numbers ?? []).filter((n) => n !== phoneNumberId);
  const { error: updErr } = await supabase.from("accounts").update({ vapi_phone_numbers }).eq("id", id);
  if (updErr) return Response.json({ ok: false, error: updErr.message }, { status: 500 });

  return Response.json({ ok: true, vapi_phone_numbers });
}
