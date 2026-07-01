// Maps between the `accounts` DB row and the shape the frontend already works with (see INITIAL_CLIENTS
// in page.js). Keeps the mapping in one place so the two never quietly drift apart.

const AVATAR_COLORS = ["#4F46FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#6366F1", "#14B8A6"];

function initialsOf(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  return words.map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "OR";
}

// Deterministic so the same account always renders the same color across reloads (no random per-render).
function colorFor(id) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function toClientShape(row) {
  return {
    id: row.id,
    name: row.business_name ?? "",
    industry: row.business_type ?? "",
    targetCustomerType: row.target_customer_type ?? "",
    email: row.contact_email ?? "",
    contact: row.contact_name && row.contact_phone ? `${row.contact_name} (${row.contact_phone})` : (row.contact_phone ?? ""),
    contactName: row.contact_name ?? "",
    contactPhone: row.contact_phone ?? "",
    timezone: row.broker_timezone ?? "America/New_York",
    avatar: initialsOf(row.business_name),
    color: colorFor(row.id),
    enabled: row.status !== "paused",
    activeServices: row.active_services ?? [],
    serviceConfigs: row.service_configs ?? {},
    // Real VAPI phone-number IDs this account owns (bought under ANY service) — these are the same
    // numbers whichever service you configure, since a phone number belongs to the client, not to one
    // service. The frontend resolves ids -> digits via GET /api/vapi/phone-numbers.
    vapiPhoneNumberIds: row.vapi_phone_numbers ?? [],
    services: row.active_services ?? [], // kept in sync with activeServices — no separate "created but inactive" list yet
    // Not yet backed by real data (tracked separately in docs/mock-and-wiring.md — dashboard KPIs / billing):
    leads: "0 Leads",
    health: "Operational",
    retainer: "$0.00",
    payment: "Unpaid",
    score: 100,
    onboarded: row.created_at ? row.created_at.split("T")[0] : "",
  };
}

export function fromOnboardingInput(body) {
  return {
    business_name: (body.name ?? "").trim(),
    business_type: (body.industry ?? "").trim() || null,
    target_customer_type: body.targetCustomerType || null,
    contact_name: (body.contactName ?? "").trim() || null,
    contact_email: (body.email ?? "").trim() || null,
    contact_phone: (body.phone ?? "").trim() || null,
    broker_timezone: body.timezone || "America/New_York",
    status: "onboarding",
  };
}
