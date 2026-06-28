import { supabase } from "./lib/supabase";

export async function logCost(
  accountId: string,
  tool: "vapi" | "apify" | "tavily" | "openrouter",
  cost: number,
  details?: string
): Promise<void> {
  const { error } = await supabase.from("costs_log").insert({
    account_id: accountId,
    tool,
    cost,
    details
  });
  if (error) {
    console.error(`[Cost Ledger] Failed to log cost: ${error.message}`);
  }
}
