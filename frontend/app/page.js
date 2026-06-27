import { supabase } from "./lib/supabase";
import DashboardClient from "./components/DashboardClient";

// Force Next.js to run this page dynamically and not cache the data during build
export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("id, business_name, contact_name, contact_email, contact_phone, broker_timezone, status, daily_dial_cap, sources, geo_city, geo_state")
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .order("business_name", { ascending: true });

  if (error) {
    console.error("Failed to fetch accounts from Supabase:", error.message);
  }

  return (
    <DashboardClient initialAccounts={accounts || []} />
  );
}
