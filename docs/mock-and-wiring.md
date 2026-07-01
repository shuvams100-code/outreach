# Reacher AI — Mock & Wiring Tracker

> Living doc. Everything in the product that is currently **mock / stubbed**, what it must be **wired to**, and **where**. Update this whenever we add a mock or wire one up. Status: 🔴 mock · 🟡 partial · 🟢 wired.

**2026-07-01: the frontend↔backend spine is now REAL**, not mock, for the core account + service lifecycle. Everything below marked 🟢 was built, then verified against the live Supabase database (create, activate two services on one account, confirm tool/prompt composition, deactivate one, confirm the other's script correctly restores, edit, enable/disable, delete) — not just written and assumed to work. What's still 🔴/🟡 is genuinely not built yet (documented below with exactly what's missing).

**2026-07-01 (later same day) — correction, read this first.** The original ask was to connect the product **end-to-end**. What actually got built is the account + service lifecycle only (above) — real and verified, but it is a *slice*, not the whole app. The user opened the Overview dashboard after a restart and (rightly) found this confusing: it still shows "Calls Placed Today: 1240", a revenue chart, System Health alerts, and a payment ledger that are **100% untouched hardcoded mock data** — none of it was ever wired, and none of it was claimed to be. **Decision: leave all of it as mock for now** — do not build further until asked. This section exists so the full list of what's still 100% mock is in one place and doesn't get lost.

### 🔴 Still 100% mock — fix later (nothing wired, nothing attempted)

| Screen / element | Source | What "real" would mean |
|---|---|---|
| **Dashboard KPI cards** — Total Active Clients, Calls Placed Today, Meetings Booked Today, Connect Rate | `TIMEFRAME_DATA` hardcoded object (`page.js` ~line 167) | aggregate from `calls`, `bookings` |
| **Revenue & Cost Performance chart** (Overview + Revenue screen) | same `TIMEFRAME_DATA` | aggregate from `costs_log`, `bookings` |
| **Revenue screen "Log Payment" ledger** | `generateMockPayments()` — invents fake rows | a real payments table (ties into the deferred Dodo decision) |
| **System Health screen / alerts** | hardcoded `errors` array (`page.js` ~line 785) | real monitoring — VAPI/Supabase/OpenRouter status, `get_advisors`-style signals |
| **Search bar** (dashboard) | filters the local mock+real merged array client-side | fine as-is once the client list itself is fully real — not urgent on its own |

### ⚠️ A related problem worth flagging on its own: mock and real clients look identical

The client list/directory *does* show real accounts now (merged in via `GET /api/accounts`) — but it also still shows the old seeded demo roster (Harbor Financial, Acme Realty, etc. — `INITIAL_CLIENTS`), and **there is nothing on screen that distinguishes a real client from a fake demo row.** This is exactly what made the dashboard look "unchanged" after the backend work — real and fake data sit side by side with no visual tell. Worth fixing whenever the mock screens above get tackled (e.g. a small "Demo" tag on seeded rows, or dropping the seed once there's enough real data to demo with).

---

## How the frontend connects (the spine — now built)

🟢 **Next.js API routes, reusing the existing `src/` engine functions directly** (the earlier "thin API routes" decision, implemented as-is — no logic duplicated in the browser):
- `frontend/app/api/_lib/accountShape.js` — maps `accounts` DB rows ↔ the shape `page.js` already works with.
- `frontend/app/api/_lib/serviceBackend.js` — `activateService` / `saveServiceDraft` / `deactivateService`. Calls the real `applyPreset()` from `src/presets.ts` (imported directly across the package boundary — confirmed this works in Next 16/Turbopack, no duplication needed) to grant tools + compose the script, then writes the client-specific fields (ICP, offer, knowledge base, booking, phone/hours, retry/enrichment, qualifying questions, warm transfer, etc.) in one pass.
- `POST/GET /api/accounts`, `PATCH /api/accounts/[id]`, `POST/DELETE /api/accounts/[id]/services` — onboarding create, edit, enable/disable toggle, activate/save-draft/deactivate/delete a service.
- `frontend/.env.local` (gitignored, `.env.example` added) holds `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` so these routes can reach the same database as the backend scripts.
- `page.js` now `fetch("/api/accounts")` on load and merges real accounts in alongside the seeded demo clients (`INITIAL_CLIENTS`) — so anything onboarded for real survives a page refresh.
- **Verified live, multi-service case included:** activating two different services on one account correctly unions `enabled_tools` and (since >1 service is active) lets the engine's own multi-role prompt composition take over; deactivating one correctly recomposes tools AND restores the remaining service's own saved script (not the generic preset default — a real bug caught and fixed during this pass, see `serviceBackend.js`).
- **Known, deliberate limitation (not a bug):** one `system_prompt`/`vapi_assistant` per account — if 2+ services are active, they share one composed agent (the engine's existing multi-role prompt, not per-direction). A true per-direction (inbound vs outbound) assistant is a bigger, separate change.
- **Still missing:** auth (no logged-in agency user concept yet — every request is unauthenticated, fine for a single-operator internal tool today, not for multiple ops users or the future client-facing dashboard).

---

## Frontend screens / data

| Area | Mock now | Wire to | Where |
|---|---|---|---|
| 🟡 Client list / directory / dashboard | real accounts fetched on load, but **merged with the seeded demo clients with no visual distinction between the two** (see the ⚠️ note above) | tag or separate real vs. seeded rows | `GET /api/accounts` |
| 🟢 Onboarding (create client) | `POST /api/accounts` — real row created, real UUID id, errors surfaced (never fakes success) | VAPI assistant isn't created at onboarding — only once a service is activated (correct: the assistant reflects the service, not the bare account) | `accounts` |
| 🟢 Edit details | `PATCH /api/accounts/[id]` for real accounts (seeded demo clients stay local-only, they don't exist in the DB) | — | `accounts` |
| 🟢 Account enable/disable toggle | `PATCH /api/accounts/[id]` sets `status: 'paused'`/`'active'`/`'onboarding'` | billing link (Dodo) still separate — the toggle itself is real | `accounts.status`, Dodo (billing link pending) |
| 🟢 Status pill (Onboarded/Active/Disabled) | derived from the real `accounts.status` enum (`onboarding`/`active`/`paused`) returned by the API | — | `accounts.status` |
| 🔴 Search bar, Dashboard KPIs/charts, Revenue ledger, System Health | **see the "Still 100% mock — fix later" table at the top of this doc** — not duplicated here | — | — |

---

## Service configuration screen (Outbound Sales — and the other 8)

| Field / control | Mock now | Wire to | Where |
|---|---|---|---|
| 🟢 Activate Service | `POST /api/accounts/[id]/services` → `applyPreset()` + client fields, for every built service (1–6) via the shared handler | — | `presets.ts`, `accounts.service_configs`/`active_services` (new columns) |
| 🟢 Save Draft | `POST .../services` with `activate:false` — saves the config, grants no tools, switches the service off if it was on | — | same as above |
| 🟢 Active-services list — **toggle** active/inactive | `DELETE .../services` (mode `off`) to switch off; `POST .../services` to switch back on — tools/prompt recompose from whatever's left active each time | — | `accounts` |
| 🟢 Active-services list — **edit** (pencil/Configure) | reloads the saved config from the real account, re-`POST`s on save | — | `presets.ts`, `accounts` |
| 🟢 Active-services list — **delete** (trash) | `DELETE .../services` (mode `delete`) — drops the config, recomposes the assistant without it | — | `accounts`, `presets.ts` |
| 🟡 Script / prompt | user's own edited text is now genuinely persisted (`system_prompt`) via `ScriptOverride` when exactly one service is active | **auto-generate** via free OpenRouter LLM from the filled config is still a frontend button idea, not built | `accounts.system_prompt`; LLM like `enrich.ts`/`icp.ts` |
| 🔴 Script variant dropdown | static templates (incl. reactivation — to be removed) | becomes secondary once auto-gen exists | `SCRIPT_VARIANTS` in `presets.ts` |
| 🔴 Opening line / success metric | local text | `accounts.first_message`, `accounts.success_definition` | `accounts` |
| 🟢 Voice profile | real names, the actual 30 VAPI-native voices, correctly persisted (`voiceProvider: "vapi"`) | **Preview button removed by decision (2026-07-02)** — VAPI has no live sample endpoint; only ~1/3 of voices have a public sample file, not worth the complexity. User will check voices directly on VAPI's own dashboard | `accounts.vapi_assistant.voice` |
| 🟢 AI Model | real names (GPT-4o-mini, GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Flash, Llama 3.3 70B/Groq — all confirmed accepted by VAPI's live API), each tagged Cheap/Premium | live **cost estimate** ($/connected-minute, $/call at 3 min) shown next to the picker, computed from VAPI's published rates — an estimate, not a live price feed (none exists) | `accounts.vapi_assistant.model` |
| 🔴 Model dropdown | **mock list** (GPT-4o-mini / GPT-4o / Claude 3.5 — invented by the builder) | real VAPI model list (decision: start fast/cheap, e.g. Groq Llama); code default is `gpt-4o-mini` | VAPI models; `accounts.vapi_assistant.model` |
| 🟡 Voicemail | UI now states "never left, hang up on machine" (correct). Engine already never leaves one (`amd` detect → no_answer; `leave_voicemail`/`voicemail_message` cols unused) | **verify** VAPI hangs up immediately on detection so no minutes are wasted | `call.ts` `amd`, VAPI |
| 🔴 Advanced config (retry/cap/enrichment/sources/call limits) | now **editable** in UI, but local-only | persist to `accounts` (`retry_rules`, `daily_dial_cap`, `enrichment_*`, `sources`, `max_call_duration_seconds`, `lead_cap_per_run`) | `accounts` |
| 🟢→🔴 Endings (check avail / book / opt-out) | shown locked (correct) | come from the preset's `enabled_tools` | `presets.ts` `enabled_tools` |
| 🟢 Target customer type (B2B/B2C) | persisted at onboarding create/edit; backend guard is real | — | `accounts.target_customer_type` |
| 🟢 ICP | persisted via Activate/Save Draft | still doesn't auto-derive `search_query` on save (that only happens lazily inside `scrapeAccount` today) | `accounts.icp_description`, `icp.ts deriveSearchTerm` |
| 🟢 Lead Qualification — questions + qualified criteria | persisted as `accounts.qualifying_questions` jsonb `{questions, qualified_criteria}` | — | `accounts.qualifying_questions` |
| 🟢 Lead Qualification — recruitment toggle | persisted; when on, stacks `outbound_sales` preset keys with `lead_qualification` so booking tools are actually granted (not just implied by the script text) | — | `serviceBackend.js`, `presets.ts` |
| 🟡 Lead source (scrape / upload) | UI gate real (B2B + active Lead Generation service); `scraping_enabled` now persisted | **engine-side** guard still only checks B2B, not "has an active lead-gen service" — add that check to `scrapeAccount` too | `scrape.ts` |
| 🟡 Scrape targeting (City/State/Radius) | `geo_city`/`geo_state`/`geo_radius_km` now persisted | **`business_type` deliberately NOT written** here — that column is the account's own industry (set at onboarding); the free-text "business type to search for" hint has no column of its own yet since the engine derives its real search term from `icp_description`, not this field | `accounts` |
| 🔴 List upload | n/a (placeholder) | upload CSV → ingest leads | `upload.ts`, Supabase Storage |
| 🟢 Offer | persisted | — | `accounts.offer` |
| 🟢 Knowledge base (text) | persisted | — | `accounts.broker_knowledge_base` |
| 🟡 Knowledge base (file upload) | 🟢 real now — uploads to the `knowledge-base-docs` Storage bucket; `.txt` text is auto-pulled into the knowledge base | PDF/DOCX are stored but not parsed yet (no extractor wired up) | Supabase Storage; `accounts.broker_knowledge_base` |
| 🟢 Meeting mode + link/address + availability + length/buffer/capacity | persisted as `accounts.booking` jsonb, verified against `booking.ts`'s expected shape | — | `accounts.booking`, `accounts.booking_capacity` |
| 🟢 Phone pool (numbers + per-number cap) | **real "+ Buy a number" button wired in** (both outbound Phone Pool and inbound Number sections) — real cost, requires area code + explicit confirm, disabled for seeded demo clients. **Numbers are shared across a client's services**: buying one under any service records it on the account (`vapi_phone_numbers`); opening any OTHER service for that client fetches the account's real numbers and pre-fills them — a number is the client's, not one service's | manual typing still available alongside buying, for numbers ported from elsewhere | `accounts.vapi_phone_numbers` |
| 🟢 Calling window (hours + timezone) | persisted | — | `accounts.calling_hours_start/end` |
| 🟢 "Configured ✓" advanced sections (retry, compliance, enrichment, sources, call limits) | now editable in the UI AND persisted (`retry_rules`, `enrichment_enabled/depth`, `sources`, `daily_dial_cap`, `max_call_duration_seconds`, `lead_cap_per_run`) | voicemail card is informational only (correctly — we never leave one, no column to write) | `accounts` |
| ⚠️ **Known limitation, not a bug:** all the fields above are columns shared by the whole account. If 2+ services are active simultaneously, the last one saved/edited wins for shared fields (ICP, offer, knowledge base, booking, phone/hours, retry/enrichment). Service-specific fields (qualifying questions, reminder timing, warm transfer) don't collide — each only writes when its own service's config includes that field. | n/a | true per-service field isolation needs a normalized services table (bigger change) | — |

## Inbound service config (AI Receptionist + Support/Complaint Line)

| Field / control | Mock now | Wire to | Where |
|---|---|---|---|
| 🟡 Inbound phone number(s) | saved in `service_configs` for display; **same VAPI-column caution as the outbound phone pool** — not written to `accounts.vapi_phone_numbers` until real numbers are provisioned | `resolveAccountId` in `tools.ts` **already reads that array to route inbound calls** — write side + provisioning still needed | `accounts.vapi_phone_numbers`; VAPI buy/assign-number API |
| 🔴 Coverage mode (business hours / after-hours / 24-7) | saved in `service_configs`; **still not enforced anywhere in the engine** — confirmed no `calling_window` logic exists in `src/`. Needs a decision: (a) informational/contractual only, or (b) real time-of-day call routing. Recommend (a) unless routing is actually required | none yet — decide before building | — |
| 🟡 Warm transfer toggle + number + hours | **now persisted for real** to `accounts.warm_transfer_number`/`warm_transfer_hours` (columns already existed, previously unused) | the columns are filled in, but **no transfer capability exists in the code at all** yet — still needs (1) a new `transfer_call` ending tool wired to VAPI's live-transfer, (2) time-gating logic checking against `warm_transfer_hours` before offering it | **new** tool in `tools.ts` |
| 🟢 "What it does" chips (Receptionist vs Support Line) | `inbound_receptionist`/`complaint_intake` presets' `enabled_tools` are real and now actually applied via the Activate-Service spine | — | `presets.ts` |
| ⚠️ **Adjacent gap found, not caused by this screen:** `webhook-vapi.ts`'s end-of-call handler explicitly **skips inbound calls** ("Non-outbound calls (reminders, inbound) don't carry our lead metadata — skip silently"). Once services 5/6 go live, inbound calls will never be logged to `calls`, never get an outcome classification, and their **cost will never be deducted from the account balance**. | n/a | give inbound calls their own metadata path (or relax the webhook's requirement) so `processVapiCallEnd` also logs/costs them | `webhook-vapi.ts` |

## Lead Generation & Enrichment (service 7 — built 2026-07-02; was 🔴 coming-soon, merged with the former service 9)

Data-only, no calling agent. Two independent toggles, not a forced pipeline — enrichment was never actually dependent on generation (`enrichAccount` enriches whatever's `state: 'new'` in `leads`, scraped or uploaded, it doesn't care which).

**Two different ways this runs, on purpose (2026-07-02 clarification):**
1. **Standalone** — client bought only this service, no calling service active on the account. Manual, by decision: nothing auto-triggers it. A "Run" action belongs on a future client-facing dashboard (not built, not started).
2. **Bundled into an active calling service** (Outbound Sales / Reactivation / Lead Qualification) that chose scraping as its lead source (`isScrapeChecked` in that service's own config, same as before this merge) — this must run **automatically**, never a separate manual click, because the calling agent has nothing to dial otherwise. Built into `runDailyAccount` itself (see below) — one entry point does both refill and dial.

| Field / control | Mock now | Wire to | Where |
|---|---|---|---|
| 🟢 ICP Description | persisted via Activate/Save Draft, same as the outbound forms | — | `accounts.icp_description` |
| 🟢 Buying Intent Signal (new field) | persisted; optional free text | soft signal only — see `enrich.ts` below, never disqualifies | `accounts.intent_signal_description` |
| 🟢 Generate New Leads toggle + city/state/radius/business type + sources (any combination) + leads-per-run | persisted | — | `accounts.geo_city/geo_state/geo_radius_km`, `accounts.sources`, `accounts.lead_cap_per_run` |
| 🟢 Enrich Leads toggle + depth | persisted | — | `accounts.enrichment_enabled/enrichment_depth` |
| 🔴 Standalone manual "Run" trigger | **by explicit decision, not built here** — no auto/scheduled option in this screen at all | belongs on a future client-facing dashboard (not built, not started) | — |
| 🟢 **Bundled auto-refill** | `runDailyAccount` (`daily.ts`) now checks: does this account have an active calling service (`Outbound Sales / Appt Setting`, `Reactivation & Renewals`, `Lead Qualification`) AND `scraping_enabled`? If yes AND the `scrubbed` backlog is below `refill_threshold` (the documented **Scraping Refill Guard** from `docs/build-plan.md` — was speced, never wired until now), it runs `scrapeAccount` → `enrichAccount` → `scrubAccount` automatically before selecting the day's call list. Failures are caught so a bad scrape never blocks dialing the existing backlog (`refillError` surfaced in the return value). | — | `daily.ts` `runDailyAccount` |
| 🟢 **Backend: intent scoring** | `enrich.ts`'s existing Tavily+LLM call now also returns `intent_match`/`intent_evidence` in the same JSON response (zero new API spend) when `intent_signal_description` is set | soft signal — `fits_icp` alone still decides `enriched` vs `disqualified`; intent never disqualifies, only tags/ranks | `leads.intent_match`, `leads.intent_evidence` |
| ⚠️ **Correction to an earlier note in this doc:** there is no cron/scheduler anywhere in the repo for *anything* yet — not scrape/enrich, and not calling either. `runDailyAccount` is a callable orchestrator, but nothing periodically invokes it per-account today; it only runs via the tenant-0-only `scripts/daily-tenant0.ts`. The auto-refill above means that whenever `runDailyAccount` *does* run (by hand today, by real Vercel Cron once that's built), lead refill and dialing happen as one call — no separate manual lead-gen step needed for the bundled case. | n/a | real multi-tenant cron (Vercel Cron per `docs/build-plan.md`'s "Daily Vercel Cron" spec) is still the actual missing piece platform-wide | — |

---

## Backend (`src/`) — mostly real, these gaps remain

| Piece | Status | Needs |
|---|---|---|
| 🟡 Email + `.ics` confirmations (`notify.ts`) | built, self-skips | `RESEND_API_KEY` + `EMAIL_FROM` set |
| 🔴 Multi-number round-robin dialing | **not built** — `placeCall` uses `vapi_phone_numbers[0]`, cap is per-account | per-number cap + rotation in `daily.ts`/`call.ts` |
| 🟡 Google Calendar sync | optional, off by default | only if a client opts into 2-way sync |
| 🔴 VAPI phone-number provisioning | not built | buy/assign numbers via VAPI API |
| 🔴 Knowledge-base file ingestion | not built | Supabase Storage + extraction step |
| 🔴 Auto-generate agent script | not built (frontend idea) | LLM call from config → `system_prompt` |
| 🟡 Reminder sweep (`reminders.ts`) — paid gating | sweep exists (1-hr confirm/reschedule on bookings), but runs unconditionally | **gate it:** only run for accounts that have the **Appointment Reminders** service active AND the "auto-remind our booked meetings" link enabled — so clients who didn't buy it get no reminder calls. Also honor the reminder timing (value/unit) instead of the hardcoded 1-hr window | `reminders.ts`, `accounts`/services state |

---

## Integrations / keys still to set up

- ~~Supabase client + API routes~~ — 🟢 done.
- ~~Voices~~ — 🟢 **done, and cheaper than planned.** Confirmed live against VAPI's real API (not 11labs, no extra key/cost): `provider: "vapi"` gives 30 free native voices (Clara, Godfrey, Elliot, Savannah, ...), `provider: "deepgram"` gives ~60 more, both included with the VAPI account you already pay for. `DEFAULT_VOICE` in `presets.ts` switched from 11labs to VAPI-native (`Elliot`) — also fixed a real bug found along the way: `buildPresetUpdate` was hardcoding `provider: "11labs"` for ANY custom voice id, which would have silently mis-routed a non-11labs voice. Both frontend voice dropdowns (outbound + inbound forms) now list the real 30 names, not invented ones (Rachel/Drew/Marcus never existed). 11labs stays available as an option (`voiceProvider` param) for later if a specific client ever wants it, but is no longer the default and costs nothing extra unless chosen.
- ~~Supabase Storage bucket~~ — 🟢 **done.** `knowledge-base-docs` bucket created; `POST /api/accounts/[id]/documents` uploads real files there. `.txt` files have their text pulled straight into the knowledge base automatically; PDF/DOCX are stored as-is (nothing lost) but not parsed yet — no PDF/DOCX text extractor wired up, that's the one honestly-remaining piece. Wired into both document-upload UIs — the second one used to fabricate a random fake filename on click with no real file picker at all; that's fixed too.
- ~~VAPI number-provisioning~~ — 🟢 **the real capability is built and verified live**: `GET /api/vapi/phone-numbers` lists the org's real numbers (confirmed: one live number, `+19432198479`, already assigned to tenant-0's assistant). `POST /api/accounts/[id]/phone-numbers` buys a new one (`provider: "vapi"` + area code, matching the no-Twilio decision) and assigns its real VAPI id to `accounts.vapi_phone_numbers`. **Deliberately not executed as a test** — buying a number has a real cost, so I verified the request shape via VAPI's own validation errors (free) rather than actually completing a purchase. **Still pending:** wiring this into the config screen's phone-pool UI (currently free-text inputs) with a "pick existing / buy new" flow instead of typed numbers.
- **Auth for the agency (ops) dashboard** — no logged-in user concept yet. Fine for one operator, not for multiple.
- **A separate client-facing self-serve dashboard** — discussed early on as a future idea, never in scope for any service screen built so far, not started. Needs its own plan (its own auth — different audience than the ops dashboard) when we get to it.
- **Resend** (`RESEND_API_KEY`, `EMAIL_FROM`) — booking/reminder emails. **Deferred by explicit choice** (2026-07-01).
- **Dodo Payments** — billing status → account on/off. **Deferred by explicit choice** (2026-07-01) — payments tracked manually via the Revenue screen's Log Payment ledger for now.
