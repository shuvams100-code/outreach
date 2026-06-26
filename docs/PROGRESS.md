# Reacher AI — Build Progress

> Living status doc. Full design → `build-plan.md` · Visual flow → `flow.html` · Per-account fields → `onboarding-checklist.md`

**Product:** Multi-tenant AI calling service. Inbound + outbound. Any business signs up; one engine handles everything — no per-client code ever. Each client = one row in `accounts`.

**Tenant-0** = Reacher AI itself (id `00000000-0000-0000-0000-000000000000`), calling insurance brokers to sell the service. This is both our dogfood and the first real test of the system.

---

## Current state (2026-06-26)

**The engine is built and unit-tested (32 tests passing). It has never made a live paid call.** Done:
outbound calling engine, CSV upload, multi-source scraping (3 sources) + enrich + scrub, calendar +
live mid-call booking tools + server, inbound answering, Slack alert, reminder-call sweep, per-lead
agent context, per-account ICP. What stands between here and revenue is **deploy + go-live + the
expansion tools** — see the pending list below.

---

## ⏳ WHAT'S LEFT (the authoritative pending list)

> Frontend, dashboards, and wiring are known and listed in §E. Everything else, grouped by purpose.

### A. Go-live critical path — between "works in tests" and "a real paid booking"
1. **Vercel deploy** — permanent public URL for the tools server + webhooks. *Keystone; unlocks most below.*
2. **Vercel Cron** — run the daily calling run + reminder sweep automatically (today: manual `npm run …`).
3. **End-of-call webhook** — save each call's transcript/recording/outcome to `calls` when it ends (esp. inbound). The *booking* already saves; the call record doesn't.
4. **Live call test** — prove one real call books a real meeting. Never done (US number can't dial India; gated on deploy / a US-side number).
5. **Billing (Dodo)** — paid → `accounts.status=active`. *First client can be invoiced by hand; not a launch blocker.*

### B. Phase-1 logic gaps — small, close before scaling
6. ✅ **US holiday skip** — `src/daily.ts` `isUsFederalHoliday()` (11 federal holidays, rule-based, unit-tested) now also gates `isWithinCallingWindow`.
7. ✅ **Booking capacity throttle** — `src/daily.ts` `atCapacity()` + `runDailyAccount` counts open bookings and pauses dialing at the ceiling (`accounts.booking_capacity`).
8. **Reminder call confirm/reschedule** — on "move it," cancel + replace the old booking (agent can confirm today; rebook-cancel not handled). *(still pending)*
9. **No-show / won-lost marking** — `bookings.outcome`/`status` columns exist; the action ties to the dashboard. *(still pending)*

### C. The "endings" + presets — the MULTIDIMENSIONAL expansion (full map → `use-cases.md`)
Turns the agent from *booking-only* into the whole service menu. Each ending tool is ~Small (same
pattern as the live-booking tools `check_availability`/`book_appointment`).

| Ending tool | Unlocks (sellable services) | Status |
|---|---|---|
| `capture_fields` (save structured answers) | Lead Qualification · Surveys · Recruitment Screening · Market Research | ✅ **Built + proven end-to-end** (`src/tools.ts` `handleCaptureFields`; saves to `leads.captured_data`; smoke-tested via the server against a real lead). |
| `take_message` | AI Receptionist · After-hours answering | ❌ next |
| `transfer_to_human` (warm transfer) | Receptionist · Live support · High-intent sales | ❌ |
| `answer_from_kb` (knowledge base) | Tier-1 Support · FAQ deflection | ❌ |
| `send_link` (SMS/email a link) | Review Generation · Payment reminders · Info send | ❌ |
| `log_ticket` | Complaint Intake · Helpdesk | ❌ |

**Per-account endings now exist:** `accounts.enabled_tools` (text[]) lists which tools an account's agent
gets; `src/tools.ts` `toolDefs()` is the registry; `sync-tools` attaches only the enabled subset. A preset
will later set `enabled_tools` (Sales → booking pair, Qualifier → `capture_fields`, …). This is the
foundation for the preset layer (item 10).

**Build order:** ✅ `capture_fields` done → `take_message` + `transfer_to_human` next (unlocks the Receptionist product, the cleanest/lowest-risk thing to sell). Then the rest.

Plus:
10. **Use-case preset layer** — one-click onboarding bundles (Sales / Receptionist / Qualifier / …) that auto-fill an account's settings + which endings are enabled. (Vision: [[project-usecase-presets]].) *(still pending — `enabled_tools` foundation done)*
11. ✅ **ICP → search terms** — `src/icp.ts` `deriveSearchTerm()`; `scrapeAccount` derives + saves the search term from `icp_description` when none is set. So onboarding = write ICP + toggle sources.
12. ✅ **Knowledge base into the agent** — `src/call.ts` `buildCallOverrides()` injects `broker_knowledge_base` so the agent can answer FAQs about the client's business (outbound via per-call override; inbound baked into the saved assistant via `make-test-assistant`). This is the "answer_from_kb" capability — no separate tool needed.

### D. Phase-2 input pipes
13. ✅ **Web-form capture** — `src/webform.ts` + `POST /webhook/leads/<token>` on the server. Each account has an unguessable `webhook_token`; the client points their form at that URL; submissions become deduped leads. Proven end-to-end. *(Instant-call-on-submit "speed-to-lead" is a deploy-time add.)*
14. ✅ **Lead-list export** — `src/export.ts` `toCsv()` + `exportLeads()`; `npm run export [-- <state>]` → `leads-export.csv`.

### E. Frontend / access (known)
14. **Auth + RLS policies** — Supabase Auth login per client; RLS scopes every query to their `account_id` (schema already carries `account_id` everywhere).
15. **Client dashboard** — leads, calls, open bookings, mark-closed.
16. **Internal ops dashboard** — all accounts, usage, call logs, errors.

> **Minimum to the FIRST paying client:** A1–A4 (deploy → cron → transcript-save → one live booking) + onboard/invoice that client by hand. Everything in B/C/D/E makes it bigger and more automated.

---

## Phase 1 — Universal core

### Step 1 — Outbound calling engine

| What | File | Status |
|---|---|---|
| VAPI call placement | `src/call.ts` `placeCall()` | ✅ Built — VAPI accepts the request (proven via `npm run call-test`) |
| Call polling / result | `src/call.ts` `pollCall()` | ✅ Built — polls until `status=ended`; production will use webhooks |
| Full call cycle | `src/call.ts` `callContact()` | ✅ Built — mark calling → place → poll → classify → save `calls` row → update lead state |
| Outcome classifier | `src/outcome.ts` `classifyCall()` | ✅ Built + unit-tested — no-answer/error → retry; booked → booked; else → not_interested |
| Daily run — list builder | `src/daily.ts` `selectCallList()` | ✅ Built + unit-tested — retries first (≤40% of cap), then fresh scrubbed; overflow rolls to next day |
| Daily run — timezone window | `src/daily.ts` `isWithinCallingWindow()` | ✅ Built + unit-tested — Mon–Fri, hours evaluated in each lead's own timezone |
| Daily run — orchestrator | `src/daily.ts` `runDailyAccount()` | ✅ Built — queries candidates → selects list → filters in-window → calls each. Run: `npm run daily` |
| VAPI assistant (script + voice) | `accounts.vapi_assistant` in DB | ✅ Done — browser-tested; voice locked to 11labs `TX3LPaxmHKxFdv7VOQHJ`; script in tenant-0 account row |
| Retry rules | `accounts.retry_rules` in DB | ✅ Done — `{"max_attempts":3,"gap_days":3,"max_share":0.4}` |
| **Live US call test** | — | ⚠️ **PENDING** — VAPI US number can't dial India (international blocked on free tier). Need a US number to dial to verify the full `callContact` cycle end-to-end |

**Skipped in this step (noted in code, not critical for first test):**
- Weekend/holiday rollover on retry scheduling — `CalcDate` sets `now + 3 days` but doesn't yet roll past weekends. Add before going live.
- Booking capacity throttle — `accounts.booking_capacity` column exists; open-booking counter not tracked yet.

---

### Step 1c — Calendar + booking

| What | File | Status |
|---|---|---|
| Google Calendar read (busy times) | `src/calendar.ts` `getBusy()` | ✅ Built + proven — `npm run probe-calendar` reads real busy blocks |
| Free slot calculation | `src/calendar.ts` `computeFreeSlots()` | ✅ Built + unit-tested — DST-correct, Mon–Fri, respects working hours and buffer |
| Create calendar event | `src/calendar.ts` `createEvent()` | ✅ Built + proven — creates event with static Meet link in description + location |
| Get available slots (per account) | `src/booking.ts` `getAvailableSlots()` | ✅ Built — loads account booking config → reads calendar → returns labeled slots |
| Book a slot (per account) | `src/booking.ts` `bookSlot()` | ✅ Built + proven — creates real calendar event; test event appeared in calendar with Meet link `https://meet.google.com/drj-vzio-ovc` |
| Tool logic (check_availability, book_appointment) | `src/tools.ts` | ✅ Built — parses VAPI's tool-call webhook, checks live slots, books + records to DB. Pure parse logic unit-tested (`src/tools.test.ts`). |
| VAPI tool server | `src/server.ts` | ✅ Built + tested locally — `POST /vapi/tools` dispatches both tools; `GET /health`. Confirmed against a simulated VAPI payload: returned real calendar slots. Run: `npm run server` |
| Attach tools to assistant | `scripts/sync-tools.ts` | ✅ Built — injects both tool definitions (with the public URL) into `accounts.vapi_assistant.model.tools`. Run: `VAPI_TOOLS_URL=<url> npm run sync-tools` |
| **Live web-test** | — | ⏸️ **DEFERRED to the Vercel step (by decision).** The server passed an internal simulated-payload test. Rather than set up ngrok + env keys twice, the live agent-books-a-real-meeting test happens once, after deploying to Vercel (where all env keys get configured together). If something breaks, we fix it live then. |
| Production URL → Vercel | — | ❌ Later — real calls need a permanent tools URL. Same Vercel step does the live-test above. |

**Note on Meet links:** Google's API cannot create dynamic Meet links through a service account on a consumer Gmail account (Workspace-only). The workaround is a static reusable Meet room (`https://meet.google.com/drj-vzio-ovc`) stored in `accounts.booking.meeting_link`. This is already in the tenant-0 account row and works correctly.

---

### Step 1d — Notifications (deliberately minimal)

**Decision (2026-06-26):** keep this lightweight. No email system. Google Calendar already reminds the
host before the meeting (native, free), and the prospect gets a reminder *call* later — so building our
own email reminders (Resend + a verified sending domain) would just duplicate the calendar. Email is a
good-to-have, revisit if a client actually asks. The only notification we build now is one Slack alert.

| What | File | Status |
|---|---|---|
| Slack alert on booking | `src/notify.ts` | ✅ Built — fires from the booking tool when a meeting books. No-ops (logs) until `SLACK_WEBHOOK_URL` is set; key added at the Vercel step. Template unit-tested (`src/notify.test.ts`). |
| Calendar reminders to host | `src/calendar.ts` `createEvent()` | ✅ Built — events now set `reminders: { useDefault: true }`, so the host gets their calendar's own popup/email reminder. This replaces a custom reminder email. |
| Reminder call to prospect ~1h before | `src/reminders.ts` | ✅ **Built** — sweep finds open bookings with a meeting in the next hour (not yet reminded), places a VAPI call with a reminder opening line, stamps `reminder_1h_sent_at`. Pure selection + message unit-tested. Runs across all accounts. `npm run reminders` (→ Vercel cron every ~15 min). ⚠️ Can't be **live-tested** until a US-reachable number / Vercel. |
| Reminder call → confirm / reschedule | `src/reminders.ts` + tools | 🟡 **Partial** — the agent can confirm, and can offer new slots via the existing booking tools. **Not yet handled:** cancelling/replacing the OLD booking on a reschedule. Lands with the dashboard's won/lost/no-show/cancel work. |
| Email reminders / nudge emails | — | ❌ **DROPPED** — replaced by Google Calendar's native reminders. Revisit only if a client needs branded emails. |
| No-show tracking | — | ⏸️ **DEFERRED** — client marks a meeting won/lost/no-show in the dashboard (`bookings.outcome` + `status` columns already exist); freeing the capacity slot happens there. Comes with the dashboard. |

---

### Step 2 — CSV upload pipe

**Complete and verified end-to-end.**

| What | File | Status |
|---|---|---|
| Parse CSV (quote-aware, no deps) | `src/upload.ts` `parseCsv()` | ✅ Built + unit-tested |
| Normalize phone → E.164 | `src/upload.ts` `normalizePhone()` | ✅ Built + unit-tested |
| Auto-map headers | `src/upload.ts` `selectUploadLeads()` | ✅ Built — maps first_name/firstname/first, phone/mobile/cell, etc. |
| Dedupe by phone | `src/upload.ts` | ✅ Built — checks intra-file + existing DB phones |
| Opt-out / DNC gate | `src/compliance.ts` | ✅ Built + unit-tested |
| Timezone from area code | `src/enrich.ts` `timezoneFromPhone()` | ✅ Built + unit-tested — ~330 US area codes, 7 buckets |
| End-to-end | `scripts/upload-tenant0.ts` | ✅ Verified — 5 sample brokers inserted correctly as `scrubbed`; `npm run upload -- <csv>` |

---

### Step 3 — Inbound answering

| What | File | Status |
|---|---|---|
| VAPI assistant exists | `accounts.vapi_assistant` | ✅ Done — same config as outbound |
| Configure inbound number | `scripts/setup-inbound.ts` | ✅ **Done** — number `+19432198479` now answered by the saved assistant. Run: `npm run setup-inbound` (after `make-test-assistant`). Reversible. |
| Booking during inbound call | `src/tools.ts` | ✅ Reuses the same `check_availability` / `book_appointment` tools — works once the tools URL is public (Vercel) and tools are attached (`sync-tools`). |
| Account resolution (no mis-booking) | `src/tools.ts` `resolveAccountId()` | ✅ **Done + verified** — outbound stamps `account_id` in call metadata; inbound maps the dialed number → owning account (confirmed against the live number). No hardcoded fallback: if it can't identify the account it refuses to book. `DEFAULT_ACCOUNT_ID` env is an opt-in for local/web testing only. |
| Save inbound call transcript to DB | — | ❌ **PENDING** — needs VAPI's end-of-call webhook → the public server (Vercel). The *booking* is already saved by the tool; only the call transcript/record needs the webhook. |

---

### Agent intelligence — per-lead context (2026-06-26)

Makes the agent walk into every call already knowing who it's talking to, instead of using one static
script blind. Three parts, all built + tested:

| What | File | Status |
|---|---|---|
| Inject research into the agent at call time | `src/call.ts` `buildContextOverride()` | ✅ Built + unit-tested — if a lead has a `business_profile`, the engine appends it as a per-call system message (preserves the account's provider/model/tools). Applies to **scraped and uploaded** leads alike. Fixed a real gap: research was being generated but never reaching the agent. |
| Enrich uploaded leads that have a website | `src/upload.ts` | ✅ Built + unit-tested — a `website`/`url`/`site` column is auto-mapped; when `enrichment_enabled` and a website is present, that lead is inserted as `new` (routed through the existing research engine) instead of straight to `scrubbed`. Upload reports a "to research" count. |
| De-hardcode the ICP (broker → per-account) | `src/enrich.ts`, `accounts.icp_description` | ✅ Built — the old baked-in "is it an insurance broker?" check is gone. The LLM now judges each lead against the account's `icp_description` (new column; tenant-0's broker definition stored as data). Blank ICP = keep everything. This is the "nothing hardcoded per client" fix. |

⚠️ Like all call behavior, the live effect can only be verified once calls run (Vercel / US number). The
selection + injection logic is unit-tested; the agent actually *using* the context is a live check.

---

## Phase 2 — Extra input pipes

| Step | File | Status |
|---|---|---|
| Multi-source scraping (registry) | `src/scrape.ts` | ✅ **Built + unit-tested** — a source registry (`ADAPTERS`); the engine runs whatever the account toggles on in `sources` and inserts leads as `new`. Reads search/location/cap from the account (nothing hardcoded). Adding a source = one registry entry; the dashboard toggle just flips `enabled` in `sources`. Run: `npm run scrape`. |
| → Sources standardized | `src/scrape.ts` `ADAPTERS` | **Universal, platform-standard set — the SAME 3 sources for every client, toggled on/off in `sources`, never customized per client.** All 3 probe-confirmed: **google_maps** (`compass~crawler-google-places`, rich — website+phone+address, ads = `isAdvertisement`) · **yellow_pages** (`trudax~yellow-pages-us-scraper`, broad, thin — `name,phone`, no website) · **hotfrog** (`crawlerbros~hotfrog-scraper`, broad, thin — `businessName,phone,address,city`, no website). **Manta dropped** (its `category` is a fixed enum, not a search term — can't target a niche). tenant-0 `sources` = all 3 enabled. |
| → Cross-source dedup | `src/scrape.ts` `selectNewLeads` | ✅ Dedup by **normalized phone + website domain**, seeded from EVERY existing lead (any state) → never re-pulls or re-contacts. Domain check catches "same business, different number" across sources. Drops ad rows + no-phone rows. Captures website (enrichment) + email when present. |
| → Field-mapping confirmation | `scripts/probe-source.ts` | ✅ **All 3 sources probe-confirmed** (google_maps, yellow_pages, hotfrog). `npm run probe-source -- <key>` runs 3 records (~cents) to re-confirm any source. |
| Scrape → enrich → scrub chain | `src/scrape.ts` → `src/enrich.ts` → `src/compliance.ts` | ✅ Wired — scrape inserts `new` → `npm run enrich` (researches each, applies the account's `icp_description`) → `npm run scrub` (opt-out gate) → `scrubbed`/ready. Per-account ICP, not broker-hardcoded. |
| Web-form capture | — | ❌ Not started. Prospect fills a form on client's site → webhook → lead created in DB. |

**Note:** tenant-0 gets leads either way — **upload** a CSV (Phase 1) or **scrape** the 3 sources above. Both land in the same enrich → scrub → call pipeline. tenant-0 `sources` set to all three enabled.

---

## Infrastructure / deployment (all pending)

| What | Status | Notes |
|---|---|---|
| Vercel deployment | ❌ **PENDING** | Deploy the tool server + daily cron. Daily run = Vercel Cron at a configurable time. Free tier is fine. |
| ngrok tunnel (dev) | ❌ **PENDING** | For local dev/testing: expose `src/server.ts` so VAPI can call the booking tools |
| Auth + Row Level Security | ❌ Not started | Supabase Auth → each client logs in → RLS scopes all queries to their `account_id`. Schema foundation already has `account_id` on all 5 tables. |
| Client dashboard | ❌ Not started | Client views their leads, calls, open bookings; marks meetings closed |
| Internal ops dashboard | ❌ Not started | Reacher AI sees all accounts, usage, call logs, errors |
| Billing (Dodo Payments) | ❌ Not started | Paid status → webhook → `accounts.status = active`. Decided: Dodo Payments (not Stripe). |

---

## What's in the codebase right now

```
src/
  lib/supabase.ts       — service-role Supabase client
  calendar.ts           — getBusy, computeFreeSlots, createEvent
  booking.ts            — getAvailableSlots, bookSlot
  tools.ts              — VAPI tools: parse/resolve, check_availability, book_appointment, capture_fields, toolDefs registry
  server.ts             — HTTP server exposing POST /vapi/tools (the live-booking endpoint)
  notify.ts             — Slack alert on booking (no email by design)
  reminders.ts          — reminder-call sweep: selectDueReminders (pure), runReminderSweep
  call.ts               — placeCall, pollCall, callContact, buildCallOverrides (knowledge base + lead context)
  daily.ts              — runDailyAccount, selectCallList, isWithinCallingWindow, isUsFederalHoliday, atCapacity
  icp.ts                — deriveSearchTerm (ICP text → scrape search query)
  webform.ts            — mapWebformLead, handleWebform (web-form capture)
  export.ts             — toCsv, exportLeads (lead-list export)
  outcome.ts            — classifyCall, isAnswered (pure, unit-tested)
  upload.ts             — parseCsv, normalizePhone, selectUploadLeads (pure, unit-tested)
  enrich.ts             — enrichLead, timezoneFromPhone, extractEmail
  compliance.ts         — isBlockedPhone, scrubAccount
  scrape.ts             — multi-source registry (google_maps/yellow_pages/hotfrog), selectNewLeads, dedup
  *.test.ts             — 32 tests, all passing

scripts/
  seed-tenant0.ts       — upsert tenant-0 account row
  upload-tenant0.ts     — CSV upload (npm run upload -- <file.csv>)
  call-test.ts          — place a test call (npm run call-test -- <phone>)
  call-contact.ts       — call a specific lead by ID
  create-test-assistant.ts — sync vapi_assistant to VAPI (browser test)
  daily-tenant0.ts      — trigger daily run manually
  probe-calendar.ts     — verify calendar read + write
  probe-booking.ts      — verify full booking flow (npm run probe-booking -- book)
  sync-tools.ts         — attach booking tools to the assistant (VAPI_TOOLS_URL=<url> npm run sync-tools)
  setup-inbound.ts      — assign the assistant to the number for inbound (npm run setup-inbound)
  run-reminders.ts      — run the reminder-call sweep once (npm run reminders)
  probe-source.ts       — cheap 3-record probe of any source to confirm output fields (npm run probe-source -- <key>)
```

**All tests pass:** `npm test` runs 40 unit tests across outcome, upload, compliance, daily, calendar, enrich, scrape, tools, notify, reminders, call, webform, export.

---

## Supabase (project `miixcjufwowjixgcnfka`)

5 tables, all with `account_id`, RLS on:
- `accounts` — all per-client config
- `leads` — contacts + state machine (new → enriched → scrubbed → calling → booked/not_interested/no_answer/disqualified). `captured_data` jsonb holds answers from `capture_fields` (qualification/surveys).
- `calls` — one row per call attempt
- `opt_outs` — DNC list
- `bookings` — schema exists; **write path built** — `src/tools.ts` `handleBookAppointment` inserts a row (status `open`) when the agent books live during a call

**Tenant-0 current state:**
- VAPI assistant configured; browser-tested
- VAPI phone: +1 (943) 219-8479 (area code 943, branded "Reacher")
- Calendar: `shuvams100@gmail.com` via service account `reacher-ai-a5d4cab2a7b9.json`
- Booking config: 30 min meetings · 15 min buffer · 9am–5pm ET · 14-day horizon · Meet link `https://meet.google.com/drj-vzio-ovc`
- 0 active leads (test data inserted and cleaned up)

---

## Things explicitly deferred and why

| Item | Why deferred | When to add |
|---|---|---|
| Weekend/holiday rollover on **retry date** | `gap_days` math doesn't yet skip weekends/holidays (the calling-window holiday check IS done — this is the separate retry-scheduling shift) | Before going live |
| Voicemail drop | VAPI already handles `did-not-give`; custom voicemail drop not needed yet | If clients want branded voicemail messages |
| Consent tracking for B2C | No B2C clients yet | Before any B2C account goes active |
| Script refinement | Deferred to a dedicated session after core machinery is done | After 1c + 1d are built |

---

## Decisions made (locked)

- **Stack:** Node.js + TypeScript + tsx · Supabase · Vercel + Vercel Cron · VAPI (in + out) · Google Calendar API · Slack (internal alerts) · Dodo Payments (billing). **Email dropped** — Google Calendar's native reminders replace it.
- **Per-account everything:** script, voice, ICP, exclusions, caps, calendar — all in `accounts` row. Zero per-client code.
- **Static Meet link:** Google can't mint Meet links via API on consumer Gmail (Workspace-only). Static room link stored in `accounts.booking.meeting_link`.
- **LLM for enrichment:** OpenRouter `openai/gpt-oss-120b:free` + `openai/gpt-oss-20b:free`. Old llama/deepseek IDs were wrong (429/404).
- **Scraping sources:** universal 3-source set (same for every client, toggled in `sources`): Google Maps (`compass~crawler-google-places`), Yellow Pages (`trudax~yellow-pages-us-scraper`), Hotfrog (`crawlerbros~hotfrog-scraper`). All probe-confirmed. Manta rejected (category-enum, not searchable).
- **Retry rules:** 3 attempts max, 3-day gap, retries capped at 40% of daily dial cap.
- **No auto-close on bookings:** client must mark meetings closed manually. Forcing function to stay engaged.
- **Product name:** Reacher AI (not Outreach.ai).
