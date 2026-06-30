# Reacher AI — Master Build Plan

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

### E. Booking & Calendar Model (locked 2026-06-30)
We do **not** depend on per-client calendar integrations (Google/Outlook OAuth). That route needs a token per client, breaks when tokens expire, and excludes anyone not on that provider. Instead:

1. **Own calendar is the source of truth.** Availability windows + bookings live in our own Postgres (`availability_windows`, `bookings`). The agent checks free slots and books against our DB — no external calendar required. (`src/booking.ts` already works this way; `src/calendar.ts` Google sync becomes optional, not required.)
2. **Confirmations by email — the body is self-sufficient.** On every booking we email both the client (business) and the customer. The **email body carries everything**: date/time and a big clickable **Join** button (virtual) or the **address + map link** (in-person) — the recipient never has to tap anything to get the link. An `.ics` invite is **attached as an optional convenience** for those who want it auto-added to their calendar (Google/Outlook/Apple all import it), but we never rely on the `.ics` — most people don't tap it. *(Email is not built yet: `src/notify.ts` is Slack-only. Needs ONE platform-level email provider (Resend) with one "from" address — not per client.)*
3. **Meeting link = the client's own reusable room.** For virtual meetings we reuse a permanent link the client gives us once (their Zoom personal room / Meet / Teams). We never generate links (that would need Zoom/Google integration). Per-meeting unique links = optional paid add-on later.
4. **Meeting mode is per-client: in-person / online / both.** Set at service setup, **required (no default)**.
   * **in-person only** → agent always books a visit; the **address** goes in the email/`.ics`. The agent is given no link, so it can never offer video.
   * **online only** → agent always books a video call; the **link** goes in the email/`.ics`. The agent is given no address, so it can never offer a visit.
   * **both** → the agent asks *"in-person or video?"* and books whichever the customer picks. Only this mode is told to ask. Mode is per individual client, **not** per industry.
5. **Availability is shared time, not per-format.** One client = one person = one calendar. **Any** booking (online or offline) blocks that slot for **both** formats — the free/busy check never filters bookings by format. Format only scopes the **windows**: a "both" client may offer e.g. in-person 9–12, online 1–5 (default for "both" = both formats, all hours). Checking a slot = *(windows that allow the requested format)* minus *(all bookings, regardless of format)*.

> Optional, never required: a client who wants live two-way Google/Outlook sync can connect it as a premium add-on. The default path above needs **zero** per-client integration.

**Build status (2026-06-30):** all of the above is implemented in the engine. `booking.ts` no longer requires Google (own DB is the source of truth; Google sync is best-effort). `computeFreeSlots` is format- and window-aware with the shared-time rule; `book_appointment`/`check_availability` take a `meeting_format`; the agent prompt gets the per-client meeting-mode line (`meetingModeInstruction`). Booking confirmation **email + `.ics`** is built in `notify.ts` (`notifyBookingEmails`) and fires on booking — it self-skips until `RESEND_API_KEY` + `EMAIL_FROM` are set. Config (`meeting_mode`, `address`, format-scoped `windows`) lives in the account's `booking` jsonb — no migration needed. The Step-2 UI to set these, and inbound customer-email capture, are still to wire.

---

## 5. Technology Stack

* **Language/Runtime:** Node.js + TypeScript
* **Hosting & Cron Scheduler:** Vercel + Vercel Cron
* **Database & Auth:** Supabase + PostgreSQL with Row-Level Security (RLS)
* **Telephony & Agent Orchestration:** VAPI (unified voice agent platform)
* **Text-to-Speech:** Deepgram Aura-2 / Cartesia Sonic (Voice: 11labs `TX3LPaxmHKxFdv7VOQHJ`)
* **Booking:** Own in-system calendar — availability windows + bookings in Postgres (`src/booking.ts`). Confirmations via email + `.ics` invite, which any calendar (Google/Outlook/Apple) imports. Per-account Google Calendar sync is **optional**, not required. *(See §4E.)*
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
4. **Own-Calendar Booking & Nudge System:** Compute free slots from availability windows minus all bookings (shared time across formats, see §4E), book into our DB, send email + `.ics` confirmations to client and customer, run the 1-hour reminders and the 24-hour unclosed-meeting nudge loop. Email provider (Resend) still to be wired — `notify.ts` is Slack-only today. *(Pending)*.
5. **Inbound Webhook Routing:** Listen for VAPI inbound call webhooks and boot up the correct account's voice assistant dynamically. *(Pending)*.
