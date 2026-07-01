# Reacher AI — Mock & Wiring Tracker

> Living doc. Everything in the product that is currently **mock / stubbed**, what it must be **wired to**, and **where**. Update this whenever we add a mock or wire one up. Status: 🔴 mock · 🟡 partial · 🟢 wired.

Today the **entire frontend is mock** — no screen talks to Supabase or the backend yet. The backend engine (`src/`) is largely real and unit-tested, but a few pieces need keys or aren't built. This doc tracks the gap.

---

## How the frontend connects (the missing spine)

🔴 **The whole frontend → backend link does not exist.** `frontend/app/page.js` reads/writes only local React state. Nothing calls Supabase or the engine.
- **Wire to:** a data layer — either Next.js API routes that import the `src/` functions, or a Supabase client in the frontend. (Earlier decision: prefer thin API routes that reuse `applyPreset` etc., so logic isn't duplicated in the browser.)
- **Also needed:** auth (who is the logged-in agency user), and per-request account scoping.

---

## Frontend screens / data

| Area | Mock now | Wire to | Where |
|---|---|---|---|
| 🔴 Client list / directory / dashboard | `INITIAL_CLIENTS` hardcoded array | `accounts` table query | Supabase `accounts` |
| 🔴 Onboarding (create client) | pushes to local `clients` state | insert into `accounts` + create VAPI assistant | `accounts`, `applyPreset()` |
| 🔴 Edit details | local patch | update `accounts` row | `accounts` |
| 🔴 Account enable/disable toggle | local `enabled` flag | `accounts.status` (+ billing link) | `accounts.status`, Dodo |
| 🔴 Status pill (Onboarded/Active/Disabled) | derived from local fields | derive from real account status + active services | `accounts`, services |
| 🔴 Search bar | filters mock array | query `accounts` | Supabase |
| 🔴 Dashboard KPIs + charts (calls, meetings, revenue) | `TIMEFRAME_DATA` mock numbers | aggregate from `calls`, `bookings`, `costs_log` | Supabase |
| 🔴 Revenue screen + "Log Payment" ledger | `generateMockPayments()` | real billing + payments | Dodo Payments + a payments table |
| 🔴 System Health screen | mock `errors` | real monitoring / advisor signals | TBD |

---

## Service configuration screen (Outbound Sales — and the other 8)

| Field / control | Mock now | Wire to | Where |
|---|---|---|---|
| 🔴 Activate Service | writes `serviceConfigs` to local client | `applyPreset(accountId, keys)` + write client-specific fields | `presets.ts`, `accounts` |
| 🔴 Active-services list — **toggle** active/inactive | flips local `activeServices` only | persist on/off; on enable call `applyPreset`, on disable remove its tools/script from the account | `accounts` (+ a `services` table or `accounts.active_services`) |
| 🔴 Active-services list — **edit** (pencil) | reloads local form | load saved config → on save re-`applyPreset` (recompose) | `presets.ts`, `accounts` |
| 🔴 Active-services list — **delete** (trash) | removes from local array | delete the service config + recompose the account's assistant without it | `accounts`, `presets.ts` |
| 🟡 Script / prompt | static default text, editable | **auto-generate** via free OpenRouter LLM from the filled config, then persist | `accounts.system_prompt`; LLM like `enrich.ts`/`icp.ts` |
| 🔴 Script variant dropdown | static templates (incl. reactivation — to be removed) | becomes secondary once auto-gen exists | `SCRIPT_VARIANTS` in `presets.ts` |
| 🔴 Opening line / success metric | local text | `accounts.first_message`, `accounts.success_definition` | `accounts` |
| 🔴 Voice profile | fake names (Rachel/Drew), **no audio** | real 11labs voice list + **▶ preview** sample | 11labs API; `accounts.voice_id` |
| 🔴 Model dropdown | **mock list** (GPT-4o-mini / GPT-4o / Claude 3.5 — invented by the builder) | real VAPI model list (decision: start fast/cheap, e.g. Groq Llama); code default is `gpt-4o-mini` | VAPI models; `accounts.vapi_assistant.model` |
| 🟡 Voicemail | UI now states "never left, hang up on machine" (correct). Engine already never leaves one (`amd` detect → no_answer; `leave_voicemail`/`voicemail_message` cols unused) | **verify** VAPI hangs up immediately on detection so no minutes are wasted | `call.ts` `amd`, VAPI |
| 🔴 Advanced config (retry/cap/enrichment/sources/call limits) | now **editable** in UI, but local-only | persist to `accounts` (`retry_rules`, `daily_dial_cap`, `enrichment_*`, `sources`, `max_call_duration_seconds`, `lead_cap_per_run`) | `accounts` |
| 🟢→🔴 Endings (check avail / book / opt-out) | shown locked (correct) | come from the preset's `enabled_tools` | `presets.ts` `enabled_tools` |
| 🟡 Target customer type (B2B/B2C) | collected at onboarding (local), **but backend guard is REAL** | persist the choice to `accounts.target_customer_type` (column added) | `accounts.target_customer_type` |
| 🔴 ICP | local text | `accounts.icp_description` (also drives search terms) | `accounts`, `icp.ts deriveSearchTerm` |
| 🔴 Lead Qualification — questions + qualified criteria | local state | persist to `accounts.qualifying_questions` (jsonb) | `accounts.qualifying_questions` |
| 🔴 Lead Qualification — recruitment toggle | local; reveals booking + switches script | maps to `lead_qualification` + `recruitment_screening` variant (capture + book) via `applyPreset` | `presets.ts` SCRIPT_VARIANTS |
| 🔴 Lead source (scrape / upload) | multi-select; **Scrape disabled unless the client has an active Lead Generation service AND is B2B** (UI gate, centralized in the shared form → applies to every service) | upload always on; engine already guards B2B. **Add engine guard:** also refuse scrape if the account has no active lead-gen service (not just B2B) | services state; `accounts.scraping_enabled`; `scrape.ts` |
| 🔴 Scrape targeting (City/State/Radius/Business type) | inputs only | `accounts.geo_city`, `geo_state`, `geo_radius_km`, `business_type`, `search_query` | `accounts` |
| 🔴 List upload | n/a (placeholder) | upload CSV → ingest leads | `upload.ts`, Supabase Storage |
| 🔴 Offer | local text | `accounts.offer` | `accounts` |
| 🔴 Knowledge base (text) | local text | `accounts.broker_knowledge_base` | `accounts` |
| 🔴 Knowledge base (file upload) | "coming soon" | upload file → store → extract text → knowledge base | **Supabase Storage bucket** + text extraction |
| 🔴 Meeting mode + link/address | local | `accounts.booking.meeting_mode` / `address` / `meeting_link` | `accounts.booking` jsonb |
| 🔴 Availability windows | local rows | `accounts.booking.windows` | `accounts.booking` jsonb |
| 🔴 Meeting length / buffer / capacity | local defaults | `accounts.booking.*`, `accounts.booking_capacity` | `accounts` |
| 🔴 Phone pool (numbers + per-number cap) | text inputs, capacity = N×cap | VAPI number provisioning + store list | `accounts.vapi_phone_numbers`; VAPI buy-number API |
| 🔴 Calling window (hours + timezone) | local | `accounts.calling_hours_start/end`, timezone | `accounts` |
| 🔴 "Configured ✓" advanced sections (retry, voicemail, compliance, enrichment, sources, caps) | **not shown yet** — preset sets them silently | surface as read-mostly cards, bound to account defaults | `accounts.retry_rules`, `voicemail_*`, `enrichment_*`, `sources`, `daily_dial_cap` |

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

- **Supabase client + API routes** (the frontend↔backend spine) — biggest item.
- **Auth** for the agency dashboard.
- **Resend** (`RESEND_API_KEY`, `EMAIL_FROM`) — booking/reminder emails.
- **Supabase Storage bucket** — knowledge-base document uploads.
- **VAPI number-provisioning API** — buying/assigning numbers from the dashboard.
- **11labs** — voice list + preview audio.
- **Dodo Payments** — billing status → account on/off, payments ledger.
