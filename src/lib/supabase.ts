import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load .env locally; on Vercel the vars come from the dashboard, so the file won't exist.
if (existsSync(".env")) process.loadEnvFile(".env");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");

// Service-role client: full access, bypasses RLS. Server-side only — never ship to a browser.
export const supabase = createClient(url, key, { auth: { persistSession: false } });
