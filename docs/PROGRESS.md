# Reacher AI — Build Progress

> Living status doc. Full design → `build-plan.md` · Visual flow → `flow.html` · Per-account fields → `onboarding-checklist.md`

**Product:** Multi-tenant AI calling service. Inbound + outbound. Any business signs up; one engine handles everything — no per-client code ever. Each client = one row in `accounts`.

**Tenant-0** = Reacher AI itself (id `00000000-0000-0000-0000-000000000000`), calling insurance brokers to sell the service. This is both our dogfood and the first real test of the system.

---

## Current state (2026-06-26)

Phase 1 is ~70% done. The core engine (calling, upload, calendar, booking logic) is built and tested in isolation. What remains is wiring the booking layer to VAPI (the tool server), building notifications, and deploying so the daily cron runs automatically.

**Phase 2 (scraping, web-form) has not started.**

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
| **VAPI tool server** | `src/server.ts` (not created) | ❌ **NOT BUILT** — this is the missing piece for 1c. VAPI needs two HTTP tool endpoints it can call mid-conversation: `POST /tools/check_availability` (returns slot options) and `POST /tools/book_appointment` (books and returns confirmation). Without this the agent cannot book live during a call. |
| **Deploy or tunnel** | — | ❌ **NOT BUILT** — the tool server needs a public URL so VAPI can reach it. Options: (a) `npm run dev` + ngrok tunnel for testing, (b) Vercel deploy for production. |

**Note on Meet links:** Google's API cannot create dynamic Meet links through a service account on a consumer Gmail account (Workspace-only). The workaround is a static reusable Meet room (`https://meet.google.com/drj-vzio-ovc`) stored in `accounts.booking.meeting_link`. This is already in the tenant-0 account row and works correctly.

---

### Step 1d — Notifications

All pending. None of this code exists yet.

| What | Status | Notes |
|---|---|---|
| Slack alert on booking | ❌ **PENDING** | Internal alert when any meeting is booked |
| Resend email to client on booking | ❌ **PENDING** | Client gets an email with the meeting details |
| Reminder call to prospect 1h before | ❌ **PENDING** | VAPI outbound call to the prospect before the meeting |
| Reminder call outcome handling | ❌ **PENDING** | Branch on the prospect's response: confirms → meeting stands; wants to reschedule → re-book a new slot (loops back through the booking flow + creates a fresh calendar event) |
| Reminder email to prospect 1h before | ❌ **PENDING** | Email to prospect before the meeting |
| Nudge email to client (24h after unresolved meeting) | ❌ **PENDING** | If client hasn't marked the meeting closed 24h after it passed |
| No-show tracking | ❌ **PENDING** | Client marks meeting as no-show; `bookings` table updated; slot freed |

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

| What | Status | Notes |
|---|---|---|
| VAPI assistant exists | ✅ Done | Same assistant config as outbound (in `accounts.vapi_assistant`) |
| **Configure inbound number** | ❌ **PENDING** | Point VAPI number +1 (943) 219-8479 to the assistant for inbound calls (settings in VAPI dashboard) |
| **Save inbound call to DB** | ❌ **PENDING** | When inbound agent books, VAPI fires a webhook; need to handle it and write to `bookings` |

---

## Phase 2 — Extra input pipes (NOT STARTED)

| Step | File | Status |
|---|---|---|
| Scraping (Apify Yellow Pages) | `src/scrape.ts` | 🟡 Skeleton from pre-pivot exists; not integrated. Actor: `trudax/yellow-pages-us-scraper`. Probed — returns name, phone, website, address. |
| Enrichment | `src/enrich.ts` | 🟡 Built but not integrated with scraping pipe. Models confirmed: `openai/gpt-oss-120b:free` (primary) + `openai/gpt-oss-20b:free` (fallback). |
| Web-form capture | — | ❌ Not started. Prospect fills a form on client's site → webhook → lead created in DB. |

**Phase 2 prerequisite:** tenant-0 needs leads. We skip scraping for now and get them via **CSV upload** (the Phase 1 upload pipe is already done). Scraping is a convenience, not a blocker.

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
  call.ts               — placeCall, pollCall, callContact
  daily.ts              — runDailyAccount, selectCallList, isWithinCallingWindow
  outcome.ts            — classifyCall, isAnswered (pure, unit-tested)
  upload.ts             — parseCsv, normalizePhone, selectUploadLeads (pure, unit-tested)
  enrich.ts             — enrichLead, timezoneFromPhone, extractEmail
  compliance.ts         — isBlockedPhone, scrubAccount
  scrape.ts             — scraping skeleton (Phase 2, not integrated)
  *.test.ts             — 17 tests, all passing

scripts/
  seed-tenant0.ts       — upsert tenant-0 account row
  upload-tenant0.ts     — CSV upload (npm run upload -- <file.csv>)
  call-test.ts          — place a test call (npm run call-test -- <phone>)
  call-contact.ts       — call a specific lead by ID
  create-test-assistant.ts — sync vapi_assistant to VAPI (browser test)
  daily-tenant0.ts      — trigger daily run manually
  probe-calendar.ts     — verify calendar read + write
  probe-booking.ts      — verify full booking flow (npm run probe-booking -- book)
```

**All tests pass:** `npm test` runs 17 unit tests across outcome, upload, compliance, daily, calendar, enrich, scrape.

---

## Supabase (project `miixcjufwowjixgcnfka`)

5 tables, all with `account_id`, RLS on:
- `accounts` — all per-client config
- `leads` — contacts + state machine (new → enriched → scrubbed → calling → booked/not_interested/no_answer/disqualified)
- `calls` — one row per call attempt
- `opt_outs` — DNC list
- `bookings` — schema exists; **write path not built** (`callContact` doesn't insert here yet)

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
| US federal holiday check in calling window | Not critical for first test; Nager.Date API is free and easy to wire | Before going live with real clients |
| Weekend rollover on retry date | `gap_days` math doesn't yet skip weekends/holidays | Before going live |
| Booking capacity throttle | No real clients yet; `booking_capacity` column exists | When first client signs up |
| `bookings` table write on booking | Not yet wired in `callContact` | When tool server is built (1c) |
| Voicemail drop | VAPI already handles `did-not-give`; custom voicemail drop not needed yet | If clients want branded voicemail messages |
| Consent tracking for B2C | No B2C clients yet | Before any B2C account goes active |
| Script refinement | Deferred to a dedicated session after core machinery is done | After 1c + 1d are built |

---

## Decisions made (locked)

- **Stack:** Node.js + TypeScript + tsx · Supabase · Vercel + Vercel Cron · VAPI (in + out) · Google Calendar API · Resend (email) · Slack (internal alerts) · Dodo Payments (billing)
- **Per-account everything:** script, voice, ICP, exclusions, caps, calendar — all in `accounts` row. Zero per-client code.
- **Static Meet link:** Google can't mint Meet links via API on consumer Gmail (Workspace-only). Static room link stored in `accounts.booking.meeting_link`.
- **LLM for enrichment:** OpenRouter `openai/gpt-oss-120b:free` + `openai/gpt-oss-20b:free`. Old llama/deepseek IDs were wrong (429/404).
- **Scraping source (Phase 2):** Apify `trudax/yellow-pages-us-scraper` for Yellow Pages US.
- **Retry rules:** 3 attempts max, 3-day gap, retries capped at 40% of daily dial cap.
- **No auto-close on bookings:** client must mark meetings closed manually. Forcing function to stay engaged.
- **Product name:** Reacher AI (not Outreach.ai).
