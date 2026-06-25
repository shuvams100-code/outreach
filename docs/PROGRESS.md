# Outreach.ai — Build Progress & Tasks

> Living log. Every session: append what was done + any decision.
> Task boxes: `[ ]` todo · `[~]` in progress · `[x]` done.
> Full design = `build-plan.md` · visual flow map = `flow.html` (open in a browser). This file tracks *execution*.

**Where we are:** Step 1 done ✅ · Step 2 (engine) planned, building next.

---

## Build order (7 steps)
1. [x] **Schema** — multi-tenant foundation
2. [~] **Engine** (account-scoped) — planned, not started
3. [ ] **Seed tenant 0 + validate**
4. [ ] **Internal ops dashboard**
5. [ ] **Auth + RLS**
6. [ ] **Broker dashboard**
7. [ ] **Onboarding flow**

---

## Tasks

### Step 1 — Schema ✅ (done 2026-06-25)
- [x] Wipe old Supabase clean (deleted 2 auth users; public schema was empty)
- [x] 5 tables: `accounts`, `leads`, `calls`, `bookings`, `opt_outs`
- [x] `account_id` FK on every non-account table (multi-tenant from line one)
- [x] Enums + lead state machine (new→enriched→scrubbed→calling→booked/no_answer/not_interested)
- [x] `updated_at` trigger (search_path pinned)
- [x] RLS enabled on all 5 (policies deferred to Step 5)
- [x] Security advisor clean

### Step 2 — Engine (build locally first, deploy last)
- [x] 2.0 Skeleton — Node/TS project + Supabase client + seed tenant-0 row ✅ (2026-06-25)
- [~] 2.1 Scrape (Apify) → `leads` (state=new) — code built + unit-checked; awaiting first real run
- [ ] 2.2 Enrich (regex → OpenRouter → Tavily) → enriched
- [ ] 2.3 Compliance gate (opt-outs + legal calling hours) → scrubbed
- [ ] 2.4 Call (VAPI) + results webhook → `calls`
- [ ] 2.5 Route results (booked→Calendar+Slack · no-answer→retry · not-interested→done) + capacity throttle
- [ ] 2.6 Reminders (Resend) — deferred until real bookings exist
- [ ] 2.7 Daily cron + deploy to Vercel

### Steps 3–7 — (expand when reached)
- [ ] 3 Seed tenant 0, run end-to-end, real dials
- [ ] 4 Ops dashboard (account list, config = 7 settings buckets, monitoring)
- [ ] 5 Auth (email+password) + RLS policies (scope every query to account_id)
- [ ] 6 Broker dashboard (read-only slice + mark-booking-closed + billing)
- [ ] 7 Onboarding flow (create account → fill 7 buckets → flip active)

---

## Decision log
Full reasoning lives in `build-plan.md`; this is the index.

- **2026-06-25 — Stack/scope locked:** Tavily for enrichment · VAPI built-in Groq model for the live call · free OpenRouter model for background enrichment · Dodo Payments for billing (paid = active switch) · full version (not MVP).
- **2026-06-25 — Phone:** VAPI native US numbers, **no Twilio** (one bill; Twilio only a later fallback).
- **2026-06-25 — Limits:** 40 dials/day **per number** (spam-safe). Spam risk = dialing pattern; cost = conversation minutes (~$0.08–0.12/min). ₹2,000 ≈ ~700 dials / ~140 conversations / 30 days.
- **2026-06-25 — Capacity:** no auto-free of ghost meetings — broker must mark closed or engine waits. 3 reminder emails (new booking · 1h before · after-meeting close nudge).
- **2026-06-25 — Step 1 built:** Supabase project `miixcjufwowjixgcnfka`. 5 tables, RLS on.
- **2026-06-25 — Tooling:** adopted Ponytail (lazy/minimal) plugin, full mode.
- **2026-06-25 — Engine approach:** build/test locally stage-by-stage, deploy to Vercel last · the lead `state` column IS the queue (no queue system) · plain website fetch before reaching for Playwright.
- **2026-06-25 — B2B vs B2C onboarding + source-agnostic ingestion (locked):** Onboarding asks (1) business name, then (2) **who their customers are** → new `accounts.customer_type` (b2b | b2c), which sets source defaults. **B2B** (targets are businesses) → scraping + CSV upload both available, toggleable. **B2C** (targets are the general public) → **scraping OFF by default, CSV upload only.** Why: the public can't be scraped (no legitimate source — consumer numbers aren't published like businesses), and **AI-voice calling of consumers needs prior written consent** (TCPA + national Do-Not-Call; FCC 2024 puts AI-generated voices under those rules). So B2C brokers bring **consented** leads (own CRM / opt-in web-form / purchased opt-in lists) and upload them. **Source-agnostic ingestion:** scraped OR uploaded, every lead passes one normalization step (→ standard lead shape, dedupe by phone, save as `new`), so the whole downstream pipeline is identical regardless of source. **DNC scrubbing + consent tracking** join the compliance gate the moment a B2C account onboards. Onboarding UI is Step 7; the `customer_type` field + normalization layer are designed in now.
- **2026-06-25 — Multi-source lead acquisition (production design from line one):** Scraping is **source-agnostic and multi-source**, not Maps-only. One coordinated run per area **fans out to all enabled sources in parallel**, normalizes each to the common lead shape, **merges + dedupes by phone** (a business on Maps+Yelp+directory = one lead), tags `leads.source`. **Default = Google Maps ONLY** (covers most local businesses + phones, cheapest; ~$0.004/lead, free $5 ≈ ~1,200 leads/mo — already over-supplies dial capacity). **Yelp / Yellow Pages / web-search = per-tenant opt-in** — built in, zero-code to enable, but each bills for its own results *with heavy overlap* (same business across sources), so they fire only when a tenant wants broader coverage and their retainer covers it; NOT always-on. **Customer CSV upload** always available + free (storage only). **LinkedIn** = optional, enrichment-only (low phone yield). **Social media excluded** (no phone numbers). Honest cost: each source bills for its own results (more sources = more scrape cost), but dedupe means **research + calling are paid once per unique business**, coverage tracking (per source) prevents re-scrape, and **the source set is a per-account setting** (budget tenant = Maps only; premium = all). Schema: `accounts.apify_actor` (single) → **`sources` jsonb** (list of {key, enabled, filters}); `scrape_runs` tracks coverage **per source**.
- **2026-06-25 — Enrichment, scraping & multi-region detail (built at 2.2+, locked now):** **(1) Enrichment chain** = regex (free) → free LLM reads website (free) → **Tavily as default final fallback** (paid, fires only when site is missing/thin; rare since upstream usually wins). LLM pick: **`gpt-oss-120b` primary, DeepSeek V4 fallback** (free, structured-output capable; ~200 req/day free limit >> our 50/day; exact `:free` IDs confirmed at build time). Output is a **detailed profile** (what they do, who they serve, specialties, a talking angle), not a one-liner. **(2) Junk** (non-broker) → new `disqualified` state, never dialed/billed. **(3) Multi-region** = per-lead timezone derived from the phone's **area code** (free static map), stored on `leads.timezone`; calling window is evaluated in each lead's local time, so one account targets many regions with zero extra config. **(4) Names:** capture first/last when the site exposes a person; when absent the call greets the business and asks live (greeting is a template on `first_message`). **(5) Scrape volume ≠ dial cap:** scrape the **full sweep** of an area (not 50), ceiling = `lead_cap_per_run` (default **500**, ~$2 worst-case one-time); dial cap stays 40/day. **(6) No re-scrape waste:** Maps has no exclusion list, so track mined (term+area) in a new **`scrape_runs`** table and always aim at fresh ground; post-scrape dedupe is the backstop. **(7) `manual_followup` view** (state=no_answer AND retry_count>=3) → name, phone, company, times called, call dates, business profile — for offline email/LinkedIn. Full visual: `flow.html`.
- **2026-06-25 — Calling window + cadence strategy (built at 2.3/2.7, locked now):** Dial **Mon–Fri only** (skip weekends) within legal hours, computed in **each lead's own timezone**; skip **US federal holidays** (small built-in date list, no dependency, one-line yearly update). These checks are the `enriched → scrubbed` compliance gate (2.3) — `scrubbed` = cleared to call now. **Spread the daily 40 across working hours, not one burst** — catches people at varied moments (better pickup) and looks less robotic to carriers (safer from spam flags); same change, both wins. Retry rationale: the 3-attempt cap is the balance — most eventual contacts happen on a *later* attempt (so abandoning after one try would *lower* total bookings), but odds thin out by attempt 4+ (so we stop at 3). Optimize **total bookings, not per-dial pickup %.** A no-answer consumes ≤3 dials over ~9 days then ages out — old leads can't choke the pipeline. Overdue retries landing on a weekend/holiday roll to the next business day automatically (dialer refuses non-business days; the due-query picks them up next valid day — no date math). Soft cap on retry share deferred — add only if data shows retries crowding out fresh (forcing fresh daily would force daily scrape spend).
- **2026-06-25 — Daily-run priority + retry policy (built at 2.5/2.7, locked now):** The daily job fills the **40-dial/day hard cap** (retries count *inside* it, never on top) by querying leads in priority order: (1) no-answers due for retry, (2) ready never-called (`scrubbed`), (3) only if still under 40, scrape+enrich fresh to top up. Scraping is demand-driven, not every-run. No-answer retry: **3 attempts, flat 3-day gap** (e.g. Mon→Thu→Sun, then give up). The `state` + `next_retry_at` columns ARE the queue — a DB query sorts it, no queue system.
- **2026-06-25 — Stage 2.1 built:** Google Maps Scraper (`compass/crawler-google-places`, ~$0.004/place) via Apify `run-sync-get-dataset-items` (no SDK, one `fetch`). `scrapeAccount(id)` reads the account's `search_query`+`geo_city`+`geo_state`, scrapes ≤50 places, drops no-phone + duplicate phones (in-DB and intra-batch), inserts the rest as `state=new`. Pure `selectNewLeads` extracted + unit-checked (`npm test`). Run: `npm run scrape`. Target still Austin TX (placeholder — scraping dials no one, so real-dial target is deferred to 2.4).
- **2026-06-25 — Stage 2.0 built:** Node/TS skeleton (`package.json`, `tsconfig.json`, `src/lib/supabase.ts`, `scripts/seed-tenant0.ts`). No `dotenv` (Node `loadEnvFile`), `tsx` runs TS directly. Service-role Supabase client. Tenant-0 seeded with fixed id `00000000-…-0000` (upsert = re-run safe), status active, target = insurance broker / Austin TX (editable). Smoke test passed: key connects, row written.
