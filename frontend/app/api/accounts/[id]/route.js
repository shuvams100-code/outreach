import { supabase } from "../../../../../src/lib/supabase";
import { toClientShape, fromOnboardingInput } from "../../_lib/accountShape";

// Edit onboarding details, or flip the account enable/disable toggle (status <-> "paused").
export async function PATCH(req, { params }) {
  const { id } = await params;
  const body = await req.json();

  const patch = {};
  if (body.name !== undefined || body.industry !== undefined || body.contactName !== undefined || body.email !== undefined || body.phone !== undefined || body.timezone !== undefined || body.targetCustomerType !== undefined) {
    Object.assign(patch, fromOnboardingInput({ ...body }));
    delete patch.status; // editing details never touches the on/off status
  }
  if (body.enabled !== undefined) {
    // Disabling pauses the account outright; re-enabling returns it to "active" if it has a service
    // running, else back to "onboarding". (Mirrors the status logic in serviceBackend.js.)
    if (!body.enabled) {
      patch.status = "paused";
    } else {
      const { data: cur } = await supabase.from("accounts").select("active_services").eq("id", id).single();
      patch.status = (cur?.active_services ?? []).length > 0 ? "active" : "onboarding";
    }
  }

  const { data, error } = await supabase.from("accounts").update(patch).eq("id", id).select("*").single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, client: toClientShape(data) });
}
