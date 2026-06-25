# Outreach.ai — Build Progress & Tasks

> Living log. Every session: append what was done + any decision.
> Task boxes: `[ ]` todo · `[~]` in progress · `[x]` done.
> Full design = `outreach-ai-build-plan.md`. This file tracks *execution*.

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
- [ ] 2.0 Skeleton — Node/TS project + Supabase client + seed tenant-0 row
- [ ] 2.1 Scrape (Apify) → `leads` (state=new)
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
Full reasoning lives in `outreach-ai-build-plan.md`; this is the index.

- **2026-06-25 — Stack/scope locked:** Tavily for enrichment · VAPI built-in Groq model for the live call · free OpenRouter model for background enrichment · Dodo Payments for billing (paid = active switch) · full version (not MVP).
- **2026-06-25 — Phone:** VAPI native US numbers, **no Twilio** (one bill; Twilio only a later fallback).
- **2026-06-25 — Limits:** 40 dials/day **per number** (spam-safe). Spam risk = dialing pattern; cost = conversation minutes (~$0.08–0.12/min). ₹2,000 ≈ ~700 dials / ~140 conversations / 30 days.
- **2026-06-25 — Capacity:** no auto-free of ghost meetings — broker must mark closed or engine waits. 3 reminder emails (new booking · 1h before · after-meeting close nudge).
- **2026-06-25 — Step 1 built:** Supabase project `miixcjufwowjixgcnfka`. 5 tables, RLS on.
- **2026-06-25 — Tooling:** adopted Ponytail (lazy/minimal) plugin, full mode.
- **2026-06-25 — Engine approach:** build/test locally stage-by-stage, deploy to Vercel last · the lead `state` column IS the queue (no queue system) · plain website fetch before reaching for Playwright.
