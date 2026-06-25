# Outreach.ai — Build Progress & Developer Roadmap

> **System Status:** Horizontal Inbound + Outbound AI Calling-as-a-Service.
> This document details exactly what has been built, what is in progress, and what is pending or skipped. A developer reading this should be able to instantly pick up the tasks from the "Pending Implementation" section.

---

## 1. Current Progress Checklist

- `[x]` Completed
- `[~]` In Progress
- `[ ]` Pending / To Be Coded

### Phase 1 — Universal Core (No Scraping)
* **Ingestion (Upload)**
  * `[x]` CSV/Excel upload parser with column auto-mapping (`src/upload.ts`)
  * `[x]` E.164 phone normalization and database deduplication
  * `[x]` Timezone extraction from area code
  * `[x]` Opt-out / DNC list compliance check during upload
* **Engine: Outbound Dialer**
  * `[x]` Place outbound call via VAPI with account's specific assistant (`src/call.ts`)
  * `[x]` Poll VAPI calls for status and download transcripts/recordings (`src/call.ts`)
  * `[x]` Timezone calling window validation: Mon-Fri 09:00 - 18:00 lead local time (`src/daily.ts`)
  * `[x]` Pure call outcome classification (`src/outcome.ts`)
  * `[x]` Dial list selection math: due retries prioritized (capped at `max_share` of daily dial cap) then fresh leads (`src/daily.ts`)
  * `[~]` Outbound orchestrator (`callContact` in `src/call.ts`) — *requires calendar booking integration*
  * `[ ]` Outbound Capacity Throttle: check `open_bookings` vs `booking_capacity` before dialing
  * `[ ]` Weekend & Holiday Rollover logic: push retry date forward if it lands on a weekend/US federal holiday
* **Booking & Calendar Core**
  * `[x]` Google Calendar busy-time queries and slot calculation (`src/calendar.ts`)
  * `[x]` Insert calendar events with description and static meeting link (`src/calendar.ts`)
  * `[ ]` Per-account credentials: load calendar credentials from account row instead of global `.env` vars
  * `[ ]` 1-Hour pre-meeting reminder call via VAPI outbound reminder assistant
  * `[ ]` 1-Hour pre-meeting reminder email via Resend
  * `[ ]` 24-Hour nudge loop: email client every 24h for unclosed meetings (won/lost/no-show)
* **Notifications**
  * `[ ]` Send Slack alert on meeting book
  * `[ ]` Send Resend email to client on meeting book
* **Inbound Answering**
  * `[ ]` Setup VAPI inbound webhook endpoint to route incoming calls to per-account assistants
  * `[ ]` Integrate inbound assistant with the booking core

### Phase 2 — Input Pipes
* **Web-Form Capture**
  * `[ ]` Webhook ingestion API endpoint to receive external form submissions
* **Scraping Pipe (B2B Only)**
  * `[x]` Apify Yellow Pages scraper (`src/scrape.ts`)
  * `[x]` Lead enrichment using OpenRouter LLM + Tavily (`src/enrich.ts`)
  * `[ ]` Refill orchestrator: run scraper/enrichment ONLY if ready database leads fall below `refill_threshold`

---

## 2. Developer Action Items (What to build next)

### Task 1: Weekend & Holiday Rollover Check for Retries
* **Where:** `src/outcome.ts` (inside `classifyCall` function) and `src/daily.ts`.
* **Details:** Currently, `classifyCall` calculates the next retry date simply as `now + gap_days`. You must add code to check if that date lands on a Saturday, Sunday, or a US Federal Holiday. If it does, roll the date forward to the next business day at 9:00 AM local time. Use a holiday list or lookup package.

### Task 2: Per-Account Google Calendar Auth
* **Where:** `src/booking.ts` (inside `loadBooking` function) and `src/calendar.ts`.
* **Details:** Currently, the calendar client (`getCalendar`) reads a global Service Account key and calendar ID from the `.env` file. You need to read the `google_calendar_credentials` field from the specific tenant's row in the `accounts` table instead.

### Task 3: Booking Capacity Throttle
* **Where:** `src/daily.ts` (inside `runDailyAccount` function).
* **Details:** Query the database for the count of meetings where `status = 'open'` for the current account. If `count >= booking_capacity`, immediately skip the outbound daily dialing loop for this account. Do not place any new calls.

### Task 4: Notifications (Slack + Resend)
* **Where:** `src/booking.ts` (inside `bookSlot` function).
* **Details:** Trigger a Slack webhook (using the account's Slack channel webhook URL) and send a confirmation email via Resend to the client's `contact_email` once a meeting is successfully booked.

### Task 5: 1-Hour Pre-Meeting Reminder Call & Email
* **Where:** A new background job or cron task (e.g., `src/reminders.ts`).
* **Details:** Query calendar bookings that are scheduled exactly 1 hour in the future. Place a quick VAPI call using a short reminder script asking the prospect to confirm, and send a Resend email containing the Google Meet link.

### Task 6: Inbound Answering Endpoint
* **Where:** Create a web server route (e.g., `/api/vapi-inbound`).
* **Details:** VAPI sends a POST request to this endpoint when an inbound call is received. Parse the request, lookup the account by the inbound phone number dialed, return the account's `vapi_assistant` configuration, and handle booking requests if the prospect wants to book a slot.

### Task 7: Scraping Backlog Guard
* **Where:** The scraper orchestrator script.
* **Details:** Before triggering an Apify scraping run, check the database count of leads in `scrubbed` state for the account. If `count >= refill_threshold`, abort the run to conserve scraper API credits.

---

## 3. Database Schema Mapping (Supabase)

| Table | Status | Columns | Notes |
|---|---|---|---|
| `accounts` | Created | `id, business_name, contact_name, contact_email, status, business_type, search_query, geo_city, geo_state, daily_dial_cap, retry_rules, calling_hours_start, calling_hours_end, vapi_phone_numbers, vapi_assistant` | Need to add fields: `booking_capacity`, `google_calendar_credentials`, `refill_threshold`. |
| `leads` | Created | `id, account_id, first_name, last_name, business_name, email, phone, timezone, source, raw_data, state, retry_count, next_retry_at, last_called_at` | `state` is the core queue driver: `new -> enriched -> scrubbed -> calling -> booked/no_answer/not_interested/disqualified`. |
| `calls` | Created | `id, account_id, lead_id, vapi_call_id, caller_id_used, outcome, duration_seconds, cost, transcript, recording_url, started_at, ended_at` | Log of every dial attempt. |
| `opt_outs` | Created | `id, account_id, phone, created_at` | Used by compliance gate to disqualify leads. |
| `bookings` | Pending | `id, account_id, lead_id, calendar_event_id, start_time, end_time, status, meeting_link` | Stores meeting status (`open` or `closed`). |
