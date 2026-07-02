# Reacher AI — Mock & Wiring Tracker

> Living doc. Everything in the product that is currently **mock / stubbed**, what it must be **wired to**, and **where**. Update this whenever we add a mock or wire one up. Status: 🔴 mock · 🟡 partial · 🟢 wired.

**2026-07-02 — outbound calling removed entirely (TCPA risk), product is now 3 services.** AI-voice cold-calling scraped/uploaded leads has no consent basis under the TCPA. Rather than build phone-type classification + a consent system to keep it, outbound was dropped: Outbound Sales / Appt Setting, Reactivation & Renewals, Lead Qualification, Appointment Reminders & Recovery, and List Cleaning are gone — code, presets, and UI. **3 services remain: AI Receptionist, Support / Complaint Line, Lead Generation & Enrichment.** One calling feature survived in a redesigned, consent-gated form: **No-Show Reduction**, a paid add-on checkbox inside AI Receptionist (not a standalone service) — see its own section below. Full reasoning in `docs/design-log.md` (2026-07-02 entry).

**2026-07-01: the frontend↔backend spine is REAL**, not mock, for the account + service lifecycle. Everything below marked 🟢 was built, then verified against the live Supabase database — not just written and assumed to work. What's still 🔴/🟡 is genuinely not built yet (documented below with exactly what's missing).

**2026-07-01 (later same day) — correction, read this first.** The original ask was to connect the product **end-to-end**. What actually got built is the account + service lifecycle only (above) — real and verified, but it is a *slice*, not the whole app. The Overview dashboard still shows "Calls Placed Today: 1240", a revenue chart, System Health alerts, and a payment ledger that are **100% untouched hardcoded mock data** — none of it was ever wired, and none of it was claimed to be. **Decision: leave all of it as mock for now** — do not build further until asked.

### 🔴 Still 100% mock — fix later (nothing wired, nothing attempted)

| Screen / element | Source | What "real" would mean |
|---|---|---|
| **Dashboard KPI cards** — Total Active Clients, Calls Placed Today, Meetings Booked Today, Connect Rate | `TIMEFRAME_DATA` hardcoded object (`page.js` ~line 167) | aggregate from `calls`, `bookings` |
| **Revenue & Cost Performance chart** (Overview + Revenue screen) | same `TIMEFRAME_DATA` | aggregate from `costs_log`, `bookings` |
| **Revenue screen "Log Payment" ledger** | `generateMockPayments()` — invents fake rows | a real payments table (ties into the deferred Dodo decision) |
| **System Health screen / alerts** | hardcoded `errors` array (`page.js` ~line 785) | real monitoring — VAPI/Supabase/OpenRouter status, `get_advisors`-style signals |
| **Search bar** (dashboard) | filters the local mock+real merged array client-side | fine as-is once the client list itself is fully real — not urgent on its own |

### ⚠️ A related problem worth flagging on its own: mock and real clients look identical

The client list/directory *does* show real accounts now (merged in via `GET /api/accounts`) — but it also still shows the old seeded demo roster (Harbor Financial, Acme Realty, etc. — `INITIAL_CLIENTS`), and **there is nothing on screen that distinguishes a real client from a fake demo row.** Worth fixing whenever the mock screens above get tackled.

---

## How the frontend connects (the spine — built)

🟢 **Next.js API routes, reusing the existing `src/` engine functions directly** (no logic duplicated in the browser):
- `frontend/app/api/_lib/accountShape.js` — maps `accounts` DB rows ↔ the shape `page.js` already works with.
- `frontend/app/api/_lib/serviceBackend.js` — `activateService` / `saveServiceDraft` / `deactivateService`. Calls the real `applyPreset()` from `src/presets.ts` to grant tools + compose the script, then writes the client-specific fields in one pass. Also `reassertRemindersAddon` — see the No-Show Reduction section below.
- `POST/GET /api/accounts`, `PATCH /api/accounts/[id]`, `POST/DELETE /api/accounts/[id]/services` — onboarding create, edit, enable/disable toggle, activate/save-draft/deactivate/delete a service.
- `page.js` `fetch("/api/accounts")` on load, merges real accounts alongside the seeded demo clients (`INITIAL_CLIENTS`) — so anything onboarded for real survives a page refresh.
- **Verified live, multi-service case included:** activating two different services on one account correctly unions `enabled_tools`; deactivating one correctly recomposes tools AND restores the remaining service's own saved script.
- **Known, deliberate limitation (not a bug):** one `system_prompt`/`vapi_assistant` per account — if 2+ services are active, they share one composed agent. A true per-direction assistant is a bigger, separate change.
- **Still missing:** auth (no logged-in agency user concept yet — fine for a single-operator internal tool today, not for multiple ops users or a future client-facing dashboard).

---

## Frontend screens / data

| Area | Mock now | Wire to | Where |
|---|---|---|---|
| 🟡 Client list / directory / dashboard | real accounts fetched on load, merged with the seeded demo clients with no visual distinction (see ⚠️ above) | tag or separate real vs. seeded rows | `GET /api/accounts` |
| 🟢 Onboarding (create client) | `POST /api/accounts` — real row created, real UUID id, errors surfaced | VAPI assistant isn't created at onboarding — only once a service is activated | `accounts` |
| 🟢 Edit details | `PATCH /api/accounts/[id]` for real accounts | — | `accounts` |
| 🟢 Account enable/disable toggle | `PATCH /api/accounts/[id]` sets `status: 'paused'`/`'active'`/`'onboarding'` | billing link (Dodo) still separate | `accounts.status`, Dodo (billing link pending) |
| 🟢 Status pill (Onboarded/Active/Disabled) | derived from the real `accounts.status` enum | — | `accounts.status` |
| 🔴 Search bar, Dashboard KPIs/charts, Revenue ledger, System Health | see the "Still 100% mock" table above | — | — |

---

## AI Receptionist + Support / Complaint Line (services 1–2)

| Field / control | Mock now | Wire to | Where |
|---|---|---|---|
| 🟢 Activate Service / Save Draft / toggle / edit / delete | same real spine as every service — `POST/DELETE /api/accounts/[id]/services` | — | `presets.ts`, `accounts.service_configs`/`active_services` |
| 🟡 Inbound phone number(s) | saved in `service_configs` for display; not written to `accounts.vapi_phone_numbers` until a real number is provisioned | `resolveAccountId` in `tools.ts` **already reads that array to route inbound calls** — write side + provisioning still needed | `accounts.vapi_phone_numbers`; VAPI buy/assign-number API |
| 🔴 Coverage mode (business hours / after-hours / 24-7) | saved in `service_configs`; **still not enforced anywhere in the engine** — no `calling_window` logic exists in `src/`. Decide: (a) informational/contractual only, or (b) real time-of-day call routing | none yet — decide before building | — |
| 🟡 Warm transfer toggle + number + hours | persisted to `accounts.warm_transfer_number`/`warm_transfer_hours` | columns filled in, but **no transfer capability exists in the code at all** — needs a `transfer_call` ending tool + time-gating vs `warm_transfer_hours` | **new** tool in `tools.ts` |
| 🟢 "What it does" chips | `inbound_receptionist`/`complaint_intake` presets' `enabled_tools` are real and applied via the Activate-Service spine | — | `presets.ts` |
| 🟢 Voice / AI Model | real VAPI-native voices and real model names | live cost estimate next to the picker | `accounts.vapi_assistant` |
| 🟢 Meeting mode + link/address + availability + length/buffer/capacity (AI Receptionist only) | persisted as `accounts.booking` jsonb | — | `accounts.booking`, `accounts.booking_capacity` |
| 🟢 Calling/coverage hours + timezone | persisted | — | `accounts.calling_hours_start/end` |
| 🟢 Max Call Length | persisted | — | `accounts.max_call_duration_seconds` |
| ⚠️ **Adjacent gap, not new:** `webhook-vapi.ts` (the outbound end-of-call handler) was deleted 2026-07-02 along with outbound — it never handled inbound calls anyway (explicit early-return: "Non-outbound calls don't carry our lead metadata — skip silently"). **Inbound calls have never been logged to `calls`, never gotten an outcome record, and their cost has never been deducted from the account balance.** This predates the outbound removal; still unbuilt. | n/a | inbound needs its own end-of-call handler and metadata path (separate from the old outbound one) | new file, replaces the deleted `webhook-vapi.ts` |

### No-Show Reduction — paid add-on inside AI Receptionist (built 2026-07-02)

The one calling feature that survived the outbound removal, redesigned around actual consent. Appointment reminders are **informational, not telemarketing** under the TCPA — informational artificial-voice calls need only *oral* prior express consent, which can be captured live during the booking call itself. So this only ever calls someone who was asked, on that same call, and said yes.

| Field / control | Status | Detail |
|---|---|---|
| 🟢 "6. No-Show Reduction" checkbox (AI Receptionist config, paid add-on) | built | `accounts.reminders_addon_enabled` — account-level "did they buy it" switch |
| 🟢 Consent capture | built | `book_appointment` tool gained `reminder_opt_in`; when the add-on is on, the composed system prompt (reasserted after every `applyPreset` call — see `reassertRemindersAddon` in `serviceBackend.js`, since preset composition rewrites the prompt from scratch each save) instructs the agent to ask before booking |
| 🟢 Per-booking consent | built | `bookings.reminder_consent` — set true only when the caller actually said yes on that call |
| 🟢 Reschedule carries consent forward | built | same appointment/relationship continuing, not a fresh ask — `handleBookAppointment` copies `reminder_consent` from the booking being rescheduled. This is also what makes the reminder loop re-fire ahead of the new time (new booking row gets a fresh `reminder_1h_sent_at = null`) |
| 🟢 `reminders.ts` sweep | built, gated | only fires when BOTH `accounts.reminders_addon_enabled` and the specific booking's `reminder_consent` are true. AI-disclosure line in the opener ("this is an automated call") |
| 🔴 Multi-tenant cron to actually run the sweep | **not built** | see "no cron anywhere" note below |
| ⚠️ Scoped on purpose | n/a | only works for Receptionist-sourced bookings (the only place consent is captured) — cannot be stretched to cover outbound win-back/reactivation calling, which is exactly the removed non-consented case |

---

## Lead Generation & Enrichment (service 3)

Data-only, no calling agent, no TCPA exposure (no call is ever placed). Two independent toggles, not a forced pipeline — enrichment was never actually dependent on generation (`enrichAccount` enriches whatever's `state: 'new'` in `leads`, scraped or uploaded, it doesn't care which).

Manual only, by decision — there is no calling service left to auto-feed, so there's nothing to bundle into. A "Run" action belongs on a future client-facing dashboard (not built, not started).

| Field / control | Status | Where |
|---|---|---|
| 🟢 ICP Description | persisted via Activate/Save Draft | `accounts.icp_description` |
| 🟢 Buying Intent Signal | persisted; optional free text; soft signal — never disqualifies, only tags/ranks | `accounts.intent_signal_description` |
| 🟢 Generate New Leads toggle + city/state/radius/business type + sources (any combination) + leads-per-run | persisted | `accounts.geo_city/geo_state/geo_radius_km`, `accounts.sources`, `accounts.lead_cap_per_run` |
| 🟢 Enrich Leads toggle + depth | persisted | `accounts.enrichment_enabled/enrichment_depth` |
| 🟢 Backend: intent scoring | `enrich.ts`'s existing Tavily+LLM call also returns `intent_match`/`intent_evidence` in the same response (zero new API spend) | `leads.intent_match`, `leads.intent_evidence` |
| 🔴 Manual "Run" trigger | **by decision, not built here** — no auto/scheduled option in this screen | future client-facing dashboard |
| 🟡 Lead source (scrape) B2B gate | UI gate real; `scrapeAccount`/`enrichAccount` refuse non-B2B accounts (authoritative, engine-side) | `scrape.ts`, `enrich.ts` |
| 🔴 List upload | n/a (placeholder) | upload CSV → ingest leads | `upload.ts`, Supabase Storage |
| 🟡 Knowledge base (file upload) | uploads to `knowledge-base-docs` Storage bucket; `.txt` auto-pulled in | PDF/DOCX stored but not parsed yet | Supabase Storage; `accounts.broker_knowledge_base` |

---

## Backend (`src/`) — mostly real, these gaps remain

| Piece | Status | Needs |
|---|---|---|
| 🟡 Email + `.ics` confirmations (`notify.ts`) | built, self-skips | `RESEND_API_KEY` + `EMAIL_FROM` set |
| 🟡 Google Calendar sync | optional, off by default | only if a client opts into 2-way sync |
| 🔴 VAPI phone-number provisioning | not built | buy/assign numbers via VAPI API |
| 🔴 Knowledge-base file ingestion | not built | Supabase Storage + extraction step |
| 🔴 Inbound call logging/outcome/cost | not built (pre-existing gap, see AI Receptionist section above) | new end-of-call handler for inbound |
| ⚠️ **No cron/scheduler exists anywhere in the repo, for anything.** Not scrape/enrich, not the reminder sweep. Every backend orchestrator (`reminders.ts` `runReminderSweep`, `scrapeAccount`, `enrichAccount`) is a callable function with zero periodic trigger — today they only run via one-off scripts against tenant-0. Real multi-tenant cron (Vercel Cron, per the original `docs/build-plan.md` spec) is the actual missing piece platform-wide. | n/a | Vercel Cron (or equivalent) invoking these per-account on a schedule |

---

## Integrations / keys still to set up

- ~~Supabase client + API routes~~ — 🟢 done.
- ~~Voices~~ — 🟢 **done, and cheaper than planned.** `provider: "vapi"` gives 30 free native voices, `provider: "deepgram"` gives ~60 more, both included with the VAPI account you already pay for. `DEFAULT_VOICE` in `presets.ts` is VAPI-native (`Elliot`).
- ~~Supabase Storage bucket~~ — 🟢 **done.** `knowledge-base-docs` bucket created; `POST /api/accounts/[id]/documents` uploads real files. `.txt` auto-pulled in; PDF/DOCX stored but not parsed.
- ~~VAPI number-provisioning~~ — 🟢 **the real capability is built and verified live**: `GET /api/vapi/phone-numbers` lists real numbers; `POST /api/accounts/[id]/phone-numbers` buys a new one. **Still pending:** wiring into the config screen's phone-pool UI with a "pick existing / buy new" flow instead of typed numbers.
- **Auth for the agency (ops) dashboard** — no logged-in user concept yet. Fine for one operator, not for multiple.
- **A separate client-facing self-serve dashboard** — discussed early, never in scope for any service screen built so far, not started.
- **Resend** (`RESEND_API_KEY`, `EMAIL_FROM`) — booking/reminder emails. **Deferred by explicit choice** (2026-07-01).
- **Dodo Payments** — billing status → account on/off. **Deferred by explicit choice** (2026-07-01) — payments tracked manually via the Revenue screen's Log Payment ledger for now.
