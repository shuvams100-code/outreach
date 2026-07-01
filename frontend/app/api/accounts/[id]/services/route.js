import { supabase } from "../../../../../../src/lib/supabase";
import { toClientShape } from "../../../_lib/accountShape";
import { activateService, deactivateService, saveServiceDraft } from "../../../_lib/serviceBackend";

// Activate (or re-save) one named service: body = { serviceKey, config, activate?: boolean }.
// activate defaults to true. Pass `activate: false` to save the config as a DRAFT — no tools are
// granted and, if the service was previously active, it's switched off (tools recomposed without it).
export async function POST(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  if (!body?.serviceKey) return Response.json({ ok: false, error: "serviceKey is required." }, { status: 400 });

  try {
    if (body.activate === false) {
      await deactivateService(supabase, id, body.serviceKey, "off");
      await saveServiceDraft(supabase, id, body.serviceKey, body.config ?? {});
    } else {
      await activateService(supabase, id, body.serviceKey, body.config ?? {});
    }
  } catch (e) {
    return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }

  const { data, error } = await supabase.from("accounts").select("*").eq("id", id).single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, client: toClientShape(data) });
}

// Deactivate (default) or fully delete a service's saved config: body = { serviceKey, mode?: "delete" }.
export async function DELETE(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  if (!body?.serviceKey) return Response.json({ ok: false, error: "serviceKey is required." }, { status: 400 });

  try {
    await deactivateService(supabase, id, body.serviceKey, body.mode === "delete" ? "delete" : "off");
  } catch (e) {
    return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }

  const { data, error } = await supabase.from("accounts").select("*").eq("id", id).single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, client: toClientShape(data) });
}
