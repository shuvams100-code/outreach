# Outreach.ai — Master Build Plan

> A managed, multi-tenant **AI calling service — inbound and outbound**. Any business signs up; our AI voice agent makes their outbound calls (qualify + book meetings) and/or answers their inbound calls after-hours (converse + book). Fully managed — the client configures once, the system runs.
>
> We are **tenant 0**: our own first customer. We use the service to call insurance brokers and sell them the service. Brokers are our **first vertical, not the product.**

---

## 1. What we're selling

A **done-for-you AI calling service**. Two directions, one engine:

* **Outbound** — the client's contacts (uploaded, captured from a form, or scraped B2B leads) get called by our AI agent, which qualifies them and books a meeting on the client's calendar.
* **Inbound** — the client's phone number routes to our AI agent after-hours / on overflow; it answers, converses, qualifies, and books — so a 2am caller never hits a dead line.

It is a **horizontal** service sold to any business that wants calls made or answered.

---

## 2. Core Architectural Principle

**Build the engine once. Each account is a settings record (data), never code.**

* The **engine** = ingestion, calling (in + out), qualifying, booking, logging. Built once.
* Each **client** = a row in `accounts` holding their settings (direction, sources, script, voice, calendar, ICP, caps).
* **Onboarding** = create account → fill settings → flip active. Never open the codebase.
* **Multi-tenant from line one.** Every table carries `account_id`; every query is scoped to it.

---

## 3. High-Level Ingestion Pipes

All input pipes normalize to **one standard contact shape** (name, phone, optional email/company/notes), dedupe by phone, and save. The pipeline downstream is identical regardless of the source.

| Pipe | Customer Type | Phase | Details |
|---|---|---|---|
| **CSV / List Upload** | B2B / B2C (consented) | 1 | Standard bulk lists uploaded directly by clients. |
| **Inbound Call** | B2B / B2C | 1 | Reactive answering route via VAPI. |
| **Web-form Capture** | B2B / B2C | 2 | Webhook API ingestion from external websites. |
| **Scraping (Apify)** | B2B only | 2 | Automated scraping (Yellow Pages/Maps). Gates: scraping only if lead backlog is below `refill_threshold`. |

---

## 4. Detailed Engine Mechanics & Rules

### A. Daily Outbound Dial list Prioritization
Outbound dialing runs on a daily Vercel Cron. The daily dial list is built using a strict mathematical prioritization model to prevent due retries from starvation or causing resource exhaustion:
1. **Daily Cap:** Limits total dials per day (default 40 calls per active phone number).
2. **Priority 1 (Due Retries):** Leads in the `no_answer` state whose `next_retry_at <= now` and `retry_count < max_attempts`. The daily list reserves up to `max_share` (default 40%, i.e., 16 calls) for due retries.
   * If there are more due retries than the retry allocation, the oldest ones are prioritized, and the rest roll over to the next day's pool.
3. **Priority 2 (Fresh Leads):** Drawn from the pool of `scrubbed` leads in ascending order of creation to fill the remaining capacity of the daily cap.
4. **Scraping Refill Guard:** Scraping runs are expensive and consume API credits. Before triggering an Apify scraping run, the system checks the number of ready leads (`scrubbed` state) in the database. If `count >= refill_threshold` (default 50), the scraping run is bypassed—the engine will dial from the existing backlog instead.

### B. Weekend & US Federal Holiday Rollover
Outbound calls should only be made during legal and professional hours (Mon–Fri, 09:00 - 18:00 lead local time).
* When a call results in a `no_answer`, the system schedules the next attempt at `now + gap_days` (default 3 days).
* **Rollover Check:** If the calculated date lands on a Saturday, Sunday, or a US Federal Holiday (verified via Nager.Date API or static lookup), the `next_retry_at` is pushed forward to the next available business day at 9:00 AM in the lead's local timezone.

### C. Capacity Throttle
The system books only as fast as the client can absorb.
* The client configures a `booking_capacity` (the maximum number of open meetings they can handle).
* The engine counts the number of open bookings (status = `open`).
* If `open_bookings >= booking_capacity`, the outbound dialing engine is paused for that account. No calls are placed.
* Inbound calls will still be answered, but the agent will state that the client is at capacity and offer to log a callback request instead of booking.
* The client must mark meetings as closed (won/lost/no-show) to free up slot capacity and resume the outbound dialing loop.

### D. The Pre-Meeting Reminder & Follow-Up System
To maximize attendance rates:
1. **1-Hour Pre-Meeting Reminder:** Exactly 1 hour before the scheduled meeting time, the system initiates:
   * A VAPI automated reminder call to the prospect to confirm their attendance.
   * A reminder email sent via Resend containing the meeting details and video link.
2. **24-Hour Nudge Loop:** Once the meeting time passes, if the client has not marked the booking as closed (won/lost/no-show), the system initiates an automated nudge email to the client. This nudge repeats every 24 hours until the client resolves the booking, ensuring the capacity throttle stays accurate.

---

## 5. Technology Stack

* **Language/Runtime:** Node.js + TypeScript
* **Hosting & Cron Scheduler:** Vercel + Vercel Cron
* **Database & Auth:** Supabase + PostgreSQL with Row-Level Security (RLS)
* **Telephony & Agent Orchestration:** VAPI (unified voice agent platform)
* **Text-to-Speech:** Deepgram Aura-2 / Cartesia Sonic (Voice: 11labs `TX3LPaxmHKxFdv7VOQHJ`)
* **Booking Integration:** Google Calendar API (configured with per-account OAuth credentials)
* **Notifications:** Slack Webhooks + Resend Email API
* **Billing System:** Dodo Payments (webhook-based activation)
* **Enrichment LLM (Scraping Pipe only):** OpenRouter Free LLM (`openai/gpt-oss-120b:free`) + Tavily

---

## 6. Contact Lifecycle States

`new -> enriched -> scrubbed -> calling -> booked / no_answer / not_interested -> disqualified`
* **`new`:** Lead ingested.
* **`enriched`:** Scraped lead enriched with B2B metadata. Uploaded leads skip this state.
* **`scrubbed`:** Cleared by DNC / Opt-Out compliance check. Ready to call.
* **`calling`:** Lead is currently being dialed.
* **`booked`:** Meeting scheduled (terminal success state).
* **`not_interested`:** Call answered, but lead declined (terminal failure state).
* **`no_answer`:** Call attempt failed (busy/voicemail/error). Retries scheduled until attempts are exhausted, at which point the lead is moved to a manual follow-up list.
* **`disqualified`:** Lead failed ICP criteria or is on the opt-out list.

---

## 7. Phase 1 Implementation Roadmap

1. **Engine Core:** Outbound calls via VAPI assistant config (`src/call.ts`) and outcome classification (`src/outcome.ts`). *(Core logic built; integration with booking is pending).*
2. **Ingestion & Compliance:** CSV Upload with E.164 normalization, timezone lookup, and DNC matching (`src/upload.ts` & `src/compliance.ts`). *(Built and verified).*
3. **Outbound Daily Scheduler:** Priority retry/fresh list generator and timezone calling window validator (`src/daily.ts`). *(Built and verified).*
4. **Google Calendar Booking & Nudge System:** Fetch busy slots, create calendar events, send Slack/Resend notifications, run the 1-hour reminders, and the 24-hour unclosed meeting nudge loop. *(Pending)*.
5. **Inbound Webhook Routing:** Listen for VAPI inbound call webhooks and boot up the correct account's voice assistant dynamically. *(Pending)*.
