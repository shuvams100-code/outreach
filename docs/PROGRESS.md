# Outreach.ai — Build Progress & Tasks

> Living log. Every session: append what was done + any decision.
> Task boxes: `[ ]` todo · `[~]` in progress · `[x]` done.
> Full design = `build-plan.md` · visual flow = `flow.html` · per-account fields = `onboarding-checklist.md`.

**Where we are:** Pivoted to a horizontal **inbound + outbound AI calling service** (2026-06-25).
Engine-centric rebuild. Phase 1 = engine core + upload + inbound. Scraping demoted to Phase 2.

---

## Build order

**Phase 1 — universal core (works for every client, no scraping):**
1. [~] **Engine: outbound call → qualify → book → notify** (VAPI + Google Calendar) — the heart
   - [x] Place call via VAPI from per-account assistant config (`src/call.ts`) — proven (VAPI accepts request)
   - [x] Agent web-tested: qualified a lead + booked a demo; objection handling added; voice locked
   - [x] 1b: wire to contacts → save outcome to `calls` → set state + retries (`src/outcome.ts` classifyCall pure+unit-tested; `callContact` orchestrator built — live-verify pending a US-reachable number)
   - [x] daily run: pick today's list (retries-capped-at-40% then fresh, cap 40) + per-lead-timezone calling window (`src/daily.ts`, pure parts unit-tested; orchestrator built, live-verify pending)
   - [ ] 1c: book on calendar when interested (needs Google Calendar)
   - [ ] 1d: notify (Slack / Resend)
2. [x] **CSV / list upload** → normalize → contact ✅ (2026-06-25) — verified end-to-end against DB (5 sample brokers inserted as `scrubbed` with correct names/phones/timezone, then cleaned up)
3. [ ] **Inbound answering** → VAPI inbound assistant → answer → qualify → book

**Phase 2 — extra input pipes:**
4. [ ] **Web-form capture** (webhook ingestion)
5. [~] **Scraping + enrichment module** (B2B-business accounts only) — *partially built pre-pivot, see below*

**Then:**
6. [ ] Tenant-0 validation (feed broker list via **upload**, run end-to-end, real dials)
7. [ ] Internal ops dashboard
8. [ ] Auth + RLS
9. [ ] Client dashboard
10. [ ] Onboarding flow

---

## What's already built (and where it now sits)

| Component | File | Status after pivot |
|---|---|---|
| Multi-tenant schema (5 tables, `account_id` everywhere, RLS on) | Supabase | ✅ Keep — generic foundation |
| Service-role Supabase client | `src/lib/supabase.ts` | ✅ Keep |
| Tenant-0 seed | `scripts/seed-tenant0.ts` | ✅ Keep (account row) |
| Opt-out / DNC compliance gate | `src/compliance.ts` | ✅ Keep — universal, runs on every pipe |
| Scraping (Yellow Pages / Maps, source per account) | `src/scrape.ts` | 🟡 Phase 2 — optional B2B pipe |
| Enrichment (regex → free LLM → Tavily) | `src/enrich.ts` | 🟡 Phase 2 — runs on scraping pipe only |
| `accounts.sources` jsonb (multi-source) | Supabase | ✅ Keep |
| `leads` enrich columns + `disqualified` state | Supabase | ✅ Keep (generalize `leads`→contacts later if needed) |

> Nothing built is wasted — the pivot **demotes** scraping/enrichment from the trunk to one optional
> pipe. The calling engine itself (outbound call + book) was never built yet — that's Phase 1, step 1.

---

## Schema notes for Phase 1

- `leads` table holds contacts fine as-is (business_name, phone, first/last name, email, raw_data).
  May rename to `contacts` when generalizing; not urgent.
- Need to add per-account: `direction` (outbound/inbound flags) · upload column-mapping · calendar
  connection · `icp_description` + `exclude_names` (per-account qualification, replaces hardcoded
  broker check) · booking settings. Add as each Phase-1 step needs them — see `onboarding-checklist.md`.

---

## Decision log

Full reasoning in `build-plan.md`; this is the index.

- **2026-06-25 — PIVOT to horizontal calling service:** Reframed from a broker-scraping outbound tool
  to an **inbound + outbound AI calling-as-a-service** for any business. Realized via three real use
  cases: (1) web-form capture → call, (2) uploaded prospect list → call, (3) **inbound after-hours
  answering** → our agent picks up, qualifies, books. Engine sits at the center; four input pipes feed
  it (upload, inbound, form, scraping); **scraping is one optional B2B pipe, not the spine**; brokers =
  tenant-0's vertical, not the product. Build order re-sequenced: **Phase 1 = engine core + upload +
  inbound** (universal, no scraping); web-form + scraping = Phase 2. All docs + flow.html rewritten.
- **2026-06-25 — Daily run built:** `src/daily.ts` — `selectCallList` (pure, tested): fill the daily cap
  in priority order, retries first capped at `max_share` (40% → 16/day, overflow rolls over), then fresh
  `scrubbed`. `isWithinCallingWindow` (pure, tested): Mon–Fri + hours evaluated in each lead's own timezone
  (Intl, area-code tz). `runDailyAccount` orchestrator queries candidates → selects → filters to in-window →
  `callContact` each. Added per-account `daily_dial_cap`, `calling_hours_start/end`. Holidays + capacity
  throttle deferred (noted in code). Run: `npm run daily`. Live-verify pending US-reachable number.
- **2026-06-25 — Phase 1 step 1b (call → outcome → state) built:** `src/outcome.ts` `classifyCall` (pure,
  unit-tested): not-answered/error/unknown → `no_answer` + retry (+gap_days, exhaust at max_attempts);
  answered+structuredData.outcome=booked → `booked`; else answered → `not_interested`. `callContact` in
  `src/call.ts` runs the full cycle (mark calling → place → poll → classify → insert `calls` row → update
  lead). `retry_rules` added to accounts (per-account). Live-verify pending a US-reachable number; the
  booked-detection (VAPI structured output) gets wired with the booking tool in 1c. Run: `npm run call-contact -- <lead-id>`.
- **2026-06-25 — Phase 1 step 1 (calling agent) proven via web test:** `src/call.ts` places VAPI calls
  from the account's `vapi_assistant` config (nothing hardcoded — script/voice/model all per-account data).
  Free US number can't dial India (international blocked) so PSTN dial untested from here, but VAPI accepted
  the call request (config valid). Web-tested the agent in-browser: it qualified a broker and booked a demo.
  Added an objection-handling playbook to the prompt. **Voice locked: 11labs `TX3LPaxmHKxFdv7VOQHJ`.**
  **Script refinement deferred** to a dedicated session once the machinery is built. Tune script/voice any
  time via SQL on `accounts.vapi_assistant`; `npm run make-test-assistant` re-syncs the browser-test copy.
- **2026-06-25 — Phase 1 step 2 (upload pipe) built + verified:** `src/upload.ts` — parse CSV
  (quote-aware) → auto-map common headers → normalize phone to E.164 → dedupe (intra-file + DB) →
  opt-out check → insert as `scrubbed` (ready) or `disqualified`. Timezone set from area code. No keys
  needed. Verified end-to-end against Supabase (5 sample rows), then cleaned. Run: `npm run upload -- <csv>`.
- **2026-06-25 — Qualification is per-account, never hardcoded:** carrier-exclusion + "is it a broker"
  is **tenant-0's ICP config** (`exclude_names` + `icp_description`), not engine logic. A B2C client
  calling consumers has no such filter. Caught a hardcoding mistake mid-build.
- **2026-06-25 — Scraping ≠ tenant-0 only:** B2B clients targeting *businesses* (commercial insurance
  brokers, etc.) also scrape; B2C clients (consumer-facing) upload consented lists. Gated by
  `customer_type` (b2b/b2c).
- **2026-06-25 — Lead source for tenant-0 scraping = Yellow Pages US** ("Insurance Brokers" category,
  `trudax/yellow-pages-us-scraper`). Category pre-excludes carriers; `isAd:true` rows dropped; phone
  normalized to E.164. Probed: output has `name, phone, website, address, categories, infoSnippet`.
  *(Now a Phase-2 concern.)*
- **2026-06-25 — Enrichment models fixed:** OpenRouter free IDs verified via `scripts/probe-llm.ts` —
  `openai/gpt-oss-120b:free` (primary) + `openai/gpt-oss-20b:free` (fallback) return 200; old
  llama/deepseek IDs were 429/404. Enrichment now: working models, 429 fallback, no hollow-success
  (empty result stays `new`), per-lead progress logging. *(Phase-2 pipe.)*
- **2026-06-25 — Stack / capacity / compliance / retry** locked — see build-plan.md §6–11.
- **2026-06-25 — Step 1 schema built:** Supabase `miixcjufwowjixgcnfka`, 5 tables, RLS on.
- **2026-06-25 — Tooling:** Ponytail (lazy/minimal) plugin, full mode.

---

## History (pre-pivot, for reference)

The original plan was a broker-only outbound scraping tool: scrape Google Maps → enrich → compliance →
call → book. Stages 2.0–2.3 were built against that frame (skeleton, scrape, enrich, compliance). The
pivot keeps the engine + compliance and demotes scrape/enrich to an optional pipe. Tenant-0 (50 Google
Maps broker leads) was deleted to start clean before the pivot.
