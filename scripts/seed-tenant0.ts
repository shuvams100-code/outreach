import { supabase } from "../src/lib/supabase";

// Fixed id so re-running updates the same row instead of creating duplicates.
const TENANT0_ID = "00000000-0000-0000-0000-000000000000";

const { data, error } = await supabase
  .from("accounts")
  .upsert({
    id: TENANT0_ID,
    business_name: "Outreach.ai (Tenant 0)",
    contact_name: "Shuvam Sarkar",
    contact_email: "shuvams100@gmail.com",
    status: "active",
    business_type: "insurance broker",
    search_query: "insurance broker",
    geo_city: "Austin",
    geo_state: "TX",
  })
  .select()
  .single();

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}
console.log("Tenant-0 ready:", data.id, "—", data.business_name, "| status:", data.status);
