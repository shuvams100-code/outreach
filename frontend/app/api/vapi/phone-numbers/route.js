import { listVapiPhoneNumbers } from "../../_lib/vapi";

// Read-only — lists every number on the VAPI org, with which (if any) accounts.vapi_phone_numbers
// array already claims it, so the UI can show "already assigned to X" vs "free to assign".
export async function GET() {
  try {
    const numbers = await listVapiPhoneNumbers();
    return Response.json({ ok: true, numbers });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
