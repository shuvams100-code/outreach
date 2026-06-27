import { supabase } from "../src/lib/supabase";

async function inspectSchema() {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error fetching accounts:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Account columns and sample data:");
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log("No accounts found in DB, or table is empty.");
  }
}

inspectSchema();
