# Outreach.ai — Build Plan

> A managed, multi-tenant **AI calling service — inbound and outbound**. Any business
> signs up; our AI voice agent makes their outbound calls (qualify + book meetings)
> and/or answers their inbound calls after-hours (converse + book). Fully managed —
> the client configures once, the system runs.
>
> We are **tenant 0**: our own first customer. We use the service to call insurance
> brokers and sell them the service. Brokers are our **first vertical, not the product.**

---

## 1. What we're selling (locked)

A **done-for-you AI calling service**. Two directions, one engine:

- **Outbound** — the client's contacts (uploaded, captured from a form, or scraped) get
  called by our AI agent, which qualifies them and books a meeting on the client's calendar.
- **Inbound** — the client's phone number routes to our AI agent after-hours / on overflow;
  it answers, converses, qualifies, and books — so a 2am caller never hits a dead line.

It is **horizontal** — sold to any business that wants calls made or answered, not a
broker-only tool. Brokers are simply the first vertical (and our own dogfood as tenant 0).

---

## 2. The one architectural principle (everything hangs off this)

**Build the engine once. Each account is a settings record (data), never code.**

- The **engine** = ingestion, calling (in + out), qualifying, booking, logging. Built once.
- Each **client** = a row in `accounts` holding their settings (direction, sources, script,
  voice, calendar, ICP, caps).
- **Onboarding** = create account → fill settings → flip active. Never open the codebase.
- **Multi-tenant from line one.** Every table carries `account_id`; every query is scoped to it.

---

## 3. The shape (engine at the center)

```
        CONTACT ENTERS                 THE ENGINE (built once)             OUTPUT
   ┌──────────────────────┐                                          ┌────────────────┐
   │ • CSV / list upload   │──┐      ┌─────────────────────────┐     │ Meeting booked  │
   │ • Inbound call         │──┼────▶│ Qualify → Book → Notify   │───▶│ on calendar     │
   │ • Web-form capture     │──┤      │ (VAPI agent + calendar)   │     │ + alerts        │
   │ • Scraping (B2B only)  │──┘      └─────────────────────────┘     └────────────────┘
   └──────────────────────┘
```

- **Two directions:** outbound (engine calls the contact) and inbound (agent answers the line).
- **Four input pipes**, all normalized to one contact shape → identical engine downstream.
  Most clients use upload / form / inbound; **scraping is one optional pipe, not the spine.**
- **Each account** picks its direction(s), input source(s), script, voice, calendar, ICP.

---

## 4. The two directions

### Outbound
Contact enters (any pipe) → normalized → saved as `new` → engine places a call via VAPI →
agent pitches/qualifies → result saved (transcript, recording, outcome) → booked / no-answer /
not-interested. Lives inside the daily run with caps, retries, and the capacity throttle.

### Inbound (after-hours answering)
The client's number (or a forwarded overflow line) points at a **VAPI inbound assistant**
configured from the account's settings. On a call: the agent answers, converses, qualifies,
and books a meeting on the client's calendar — then the same notifications fire. No daily-run,
no dial cap (it's reactive), but the **same booking + calendar + capacity + notification core.**

---

## 5. Input pipes (how a contact enters)

All four normalize to **one standard contact shape** (name, phone, optional email/company/notes),
dedupe by phone, save as `new`. The pipeline downstream is identical regardless of source.

| Pipe | Who uses it | Phase |
|---|---|---|
| **CSV / list upload** | Any client with a prospect list (consented for B2C) | **1** |
| **Inbound call** | Any client wanting after-hours answering | **1** |
| **Web-form capture** (webhook) | Clients capturing leads on their own site | 2 |
| **Scraping** (Apify) | Only B2B clients targeting *businesses* (tenant-0, commercial brokers) | 2 |

**`customer_type` (b2b / b2c) gates scraping:** B2B (targets businesses) → scraping available;
B2C (targets individuals) → scraping OFF, upload/form only — the public can't be scraped, and
AI-voice consumer calls require prior consent (TCPA + national DNC; FCC 2024 covers AI voices).

---

## 6. Tech stack

| Layer | Tool |
|---|---|
| Language | Node.js + TypeScript |
| Hosting / scheduler | Vercel + Vercel Cron (free `.vercel.app` URL is fine) |
| Database / source of truth | Supabase |
| Auth + access control | Supabase Auth + Row-Level Security (RLS) |
| Call orchestration (in + out) | **VAPI** (outbound dialer + inbound assistant on one platform) |
| Phone numbers + telephony | **VAPI native US/Canada numbers** (area-code selectable; one bill). Twilio only later |
| Speech-to-text | Deepgram |
| Text-to-speech | Deepgram Aura-2 (or Cartesia Sonic) |
| Booking | Google Calendar API |
| Notifications (internal) | Slack |
| Notifications (client-facing) | Resend |
| Billing / payments | Dodo Payments (paid status drives the account's active switch) |
| Upload parsing | CSV parse in-engine (no new dep if avoidable) |
| Enrichment (scraping pipe only) | Regex → free LLM (OpenRouter `gpt-oss-120b:free`) → Tavily |
| Scraping (optional pipe) | Apify (source per account: Yellow Pages, Google Maps, etc.) |

> **Live-call LLM** = VAPI's built-in fast model (Groq Llama, ~200ms). VAPI bills per minute.
> **Enrichment LLM** = free OpenRouter model — only runs on the scraping pipe, not latency-sensitive.

---

## 7. What's customizable per account (the settings row)

Everything below is a field on the account; everything else is the engine.

**Identity & contact** — business name · contact name · contact email (alerts + reminders) ·
contact phone · dashboard login · client's own timezone.

**Direction** — outbound on/off · inbound on/off (a client can run either or both).

**Input sources** — which pipes are enabled (`sources`) · `customer_type` (b2b/b2c) ·
uploaded file + column mapping · web-form webhook · scraping config (search/geo/actor) if B2B.

**The agent (VAPI — used for both directions)** — system prompt / script · first message ·
voice ID · the offer · qualifying questions · knowledge base · success definition ·
voicemail drop (outbound) · max call duration.

**Phone numbers (VAPI)** — caller-ID number(s), area-code matched · inbound number(s) ·
branded caller-ID name · warm-transfer number + hours · **daily dial cap per number** (default 40).

**Qualification / ICP (optional, source-dependent)** — `icp_description` (what's a good lead,
fed to enrichment) · `exclude_names` (name blocklist, e.g. carriers for tenant-0). Empty for
clients whose pipe needs no filtering (a clean uploaded list doesn't).

**Booking** — Google Calendar connection · meeting length + buffer · availability windows ·
meeting type (Meet / phone / in-person) · booking link · warm-transfer number.

**Account-level** — active/paused (master lever) · pricing tier + billing status (Dodo) ·
legal calling window (per-lead timezone) · daily dial cap · refill threshold · booking capacity.

> The single most important field in the whole pipeline is a **clean, dialable phone number.**

---

## 8. The contact lifecycle (outbound)

`new → enriched* → scrubbed → calling → booked / no_answer / not_interested`, plus terminal
`disqualified`. *Enrichment only runs on the scraping pipe; uploaded/form contacts skip straight
to the compliance gate.

The `state` field IS the queue — a DB query in priority order drives the daily run, no queue system.
Inbound calls don't traverse this; they land directly as a `booked` (or logged) outcome.

---

## 9. Trigger model + capacity throttle (locked)

**Outbound is automatic, per-account, demand-driven. "Active" is the only lever.** A daily Vercel
Cron fires for all active accounts; each reads its state and picks the action (dial the ready queue,
refill if thin, or rest if capacity is full). Inbound is reactive (no trigger — calls arrive).

**Capacity throttle:** the client sets a **booking capacity** (meetings they can handle). The engine
watches **open bookings** (booked, not yet marked closed). Free capacity = capacity − open. At zero,
the engine stops producing new bookings (pauses outbound dialing; inbound still answers but the client
is at their stated ceiling). The client marks bookings closed (won/lost/no-show) → frees a slot →
engine pursues one new lead. **No auto-close** — a stalled machine is the forcing function.

---

## 10. Notification layer (locked)

**Resend**, fired from the daily loop. Three client-facing triggers: **(1)** new meeting booked ·
**(2)** 1 hour before the meeting · **(3)** meeting passed + still not marked closed (wait 24h, nudge).
Plus an optional internal **Slack** alert per booking. Emails deep-link into the open-bookings view.

---

## 11. Compliance (locked)

- **Opt-out / DNC gate** (`enriched/normalized → scrubbed`): phone on the account's opt-out list →
  `disqualified`. Universal, runs on every pipe.
- **Calling window** evaluated in **each lead's own timezone** (from phone area code) — Mon–Fri,
  inside legal hours, skipping US federal holidays (Nager.Date, free, auto-refresh yearly). Checked
  at dial time (outbound only).
- **B2C consent:** B2C accounts bring consented lists only; DNC scrubbing + consent tracking required
  before activating. Inbound is consent-clean by nature (the person dialed in).

---

## 12. Build order (first → last)

**Phase 1 — the universal core (works for every client, no scraping needed):**
1. **Engine: outbound call → qualify → book to calendar → notify** (the heart; VAPI + Calendar).
2. **CSV / list upload** → normalize → contact ready to call.
3. **Inbound answering** → VAPI inbound assistant → answer → qualify → book.

**Phase 2 — extra input pipes:**
4. **Web-form capture** (webhook ingestion).
5. **Scraping + enrichment module** (reuse `scrape.ts` / `enrich.ts`), B2B-business accounts only.

**Then:** tenant-0 validation (feed our broker list via **upload** — no scraping needed to test) →
internal ops dashboard → Auth + RLS → client dashboard → onboarding flow.

> Tenant-0 still works in Phase 1: we **upload** a broker list instead of scraping. Scraping is a
> convenience added in Phase 2, not a prerequisite.

---

## 13. Cost & limits (reality check)

- **What costs money:** live *conversation* minutes (~$0.08–0.12/min all-in). Ringing / no-answer
  is ~free. Inbound costs the same per talk-minute.
- **Spam flags:** driven by *outbound dialing* patterns per number, not conversations. Per-number
  dial cap = 40/day; scale by adding numbers (+40 each), never by overloading one. Inbound has no
  spam risk (the person called us).
- **₹2,000 (~$21) budget** ≈ ~700 dials / ~140 conversations / 30 days; +$10 VAPI signup credit pushes
  it higher. Budget runs out long before spam is ever a risk.

---

## 14. Decision log (highlights — full history in PROGRESS.md)

- **Pivot (2026-06-25):** reframed from a broker-scraping outbound tool to a **horizontal inbound +
  outbound AI calling service**. Engine at the center; four input pipes (upload, inbound, form, scrape);
  scraping demoted to one optional B2B pipe; brokers = tenant-0's vertical, not the product. Build
  order re-sequenced: **Phase 1 = engine core + upload + inbound** (universal); scraping = Phase 2.
- **Stack locked:** VAPI (calls + numbers, in + out) · Supabase · Vercel · Dodo (billing→active) ·
  Resend (client) · Slack (internal) · Google Calendar · Deepgram.
- **Per-account, never hardcoded:** direction, sources, ICP/exclusions, script, voice, caps, calendar
  — all settings on the account row. Carrier-exclusion is **tenant-0 config**, not engine logic.
- **Capacity throttle:** open-bookings based, no auto-close, 3 reminder emails.
- **Compliance:** per-lead-timezone calling window, weekends + holidays, opt-out gate, B2C consent.
- **Retry:** 3 attempts, flat 3-day gap, capped at 40% of the daily dial cap.
