# Outreach.ai — Finalized Build Plan

> A managed, multi-tenant cold-calling service. We onboard one market at a time
> (starting with **US insurance brokers**). The AI voice agent does the dialing,
> qualifying, and booking. Brokers are our paying customers — and our own outbound
> targets the same broker market, so we run on our own rails as **tenant 0**.

---

## 1. The core idea (locked)

- We sell a **done-for-you** cold-calling service. Brokers pay; the system scrapes
  leads, enriches them, calls them via an AI voice agent, and books appointments.
- **Layered customer model:**
  - *Our customer* = US insurance brokers.
  - *Their customers* = whoever the broker sells insurance to (varies by broker).
  - We also call brokers ourselves to sell them the service → we are **tenant 0**,
    customer zero, dogfooding on our own product.
- The broker's targeting depends on what they sell (life, commercial, etc.). That's
  just a different filter + prompt per account — not different code.

---

## 2. The one architectural principle (everything hangs off this)

**Build the engine once. Each account is a settings record (data), never code.**

- The **engine** = scraping, enrichment, calling, logging. Built once. Never touched
  per client.
- Each **broker** = a row in an `accounts` table holding their variable settings.
- **Onboarding a broker** = create account → fill settings → flip active.
  Never open the codebase. Add broker #50 by adding row #50.
- **Multi-tenant from line one.** Every table carries `account_id`; every query is
  scoped to it. We do NOT retrofit this later — we start clean with it as the first
  assumption. (Old single-tenant engine is being deleted and rebuilt from scratch.)

---

## 3. Tech stack (unchanged — same tools, fresh multi-tenant build)

| Layer | Tool |
|---|---|
| Language | Node.js + TypeScript |
| Hosting / scheduler | Vercel + Vercel Cron (free `.vercel.app` URL is fine — no domain needed for the app) |
| Database / source of truth | Supabase |
| Auth + access control | Supabase Auth + Row-Level Security (RLS) |
| Scraping | Apify (Google Maps Scraper for MVP) |
| Crawl | Node/TS crawler (Playwright if JS-heavy) |
| Enrichment | Regex first → LLM fallback (OpenRouter) → Perplexity for gaps |
| Call orchestration | VAPI |
| Telephony / numbers | Twilio |
| Speech-to-text | Deepgram |
| Text-to-speech | Deepgram Aura-2 (or Cartesia Sonic) |
| Booking | Google Calendar API |
| Notifications (internal) | Slack |
| Notifications (broker-facing) | Resend |

> **To resolve:** the old doc said *Tavily*, the stack said *Perplexity* for web
> enrichment. Pick ONE and kill the ambiguity. Also confirm the exact low-latency
> LLM for the live call.

---

## 4. What's customizable per account (the `accounts` settings)

Everything below is a **settings field** on the account. Everything else lives in the
engine.

**Apify / scraping**
- Search query / business type
- Geography (city, state, radius, area codes)
- Which actor (Google Maps / LinkedIn / etc.)
- Lead cap per run + filters
- Scraping on/off (some brokers upload their own Excel instead)

**Enrichment**
- On/off
- What to research per lead + which fields get injected into the prompt
- Depth (light vs deep)

**Twilio / numbers**
- Caller ID number(s), ideally area-code matched to target geo
- Number pool (for rotation) if needed
- Broker's real number for warm transfers / callbacks

**VAPI / the agent**
- System prompt / script template (with placeholders filled per call)
- First message (opening line)
- Voice ID
- The offer being pitched
- Qualifying questions
- Success definition (what counts as a booked appointment)
- Calendar link
- Warm-transfer number
- Voicemail drop message
- Max call duration, retry rules

**Account-level**
- Active / paused (our single master lever)
- Pricing tier
- **Timezone + legal calling window** (per-account — critical once multiple states run at once)
- **Daily dial cap**
- **Refill threshold** (scrape more when callable leads drop below N)
- **Booking capacity** (max open bookings the broker can handle) — see §7

> Critical reminder: clean, dialable phone numbers are the single most important field
> in the whole pipeline. Apify *produces* the number; enrichment only *adds context*.
> Don't rely on the enrichment tool to find numbers — number quality drives connect rate.

---

## 5. Dashboards & access (locked)

**Internal ops dashboard** (our cockpit — build this, we live here)
- Account list: create, activate/pause, master kill-switch.
- Configuration panel: edit every account's settings (we configure the broker's prompt
  etc. from our side — brokers don't touch prompt logic).
- Monitoring: global overview across all accounts + per-account drill-down into every
  individual call (who, picked up?, transcript, recording, outcome).

**Broker dashboard** (derivative — filtered, read-only, login-gated slice of the ops view)
- Each broker sees ONLY their data.
- Brokers come in only to **watch results** and **mark bookings closed** (see §7).
  Fully managed — they do not run or configure anything.

**Access model — DECIDED: email + password login + RLS.**
- Not magic links (a link is a credential anyone can hold; we're showing real prospect
  data + call recordings).
- Supabase Auth maps the logged-in user → their `account_id`; RLS makes the database
  itself refuse any row that isn't theirs. Same `account_id` scoping the engine uses.
- (Passwordless email login is an optional friction-free variant if we want it later.)

---

## 6. How data flows in the backend (the lead lifecycle)

The whole backend is **one loop, keyed by `account_id`**, with leads marching through
states. The `state` field on each lead IS the pipeline — the data tells the engine what
to do next.

```
Trigger (Vercel Cron, daily) 
  → ask accounts table: who is active?
  → for each active account, read ITS settings and run:

   Apify scrape ──► leads (account_id, state = new)
        │
        ▼
   Crawl + enrich (regex → LLM → Perplexity)  ──► state: new → enriched
        │
        ▼
   Compliance gate (opt-out list + calling hours, per account) ──► enriched → scrubbed
        │
        ▼
   VAPI call (account's prompt + voice + Twilio caller ID) ──► scrubbed → calling
        │   (heavy work runs on VAPI's servers; webhooks call us back)
        ▼
   Result lands ──► calls table (account_id, transcript, recording, outcome)
        │
        ├─ booked          → Google Calendar event + Meet link, Slack alert, → booked
        ├─ no answer       → → no-answer (queued for retry)
        └─ not interested  → → not-interested (done)

   Reminder loop: Vercel Cron re-triggers VAPI ~1hr before booked meetings.
```

State machine: `new → enriched → scrubbed → calling → booked / no-answer / not-interested`

**Why the dashboards are then trivial:** every row above is tagged with `account_id`.
Ops dashboard = "show all rows." Broker dashboard = "show rows where account_id = me."
One data flow, two windows.

---

## 7. Trigger model + capacity throttle (locked — this is the clever part)

**Automatic, per-account, demand-driven. "Active" is our only lever.**

- The daily cron fires for ALL active accounts. The broker chooses nothing about *when* —
  they chose when they signed up. This matches the "fully managed" pitch; a "start"
  button would make it a tool they operate, not a service we run.
- On each fire, the engine reads each account's state and picks the right action:
  - **Callable queue healthy** (`scrubbed` / retry-due `no-answer`) → skip scraping,
    just dial through it. No wasted Apify calls.
  - **Queue thin/empty** → scraping is triggered to refill (scrape **when empty**, not
    "rest when empty" — empty means go get more). Governed by the **refill threshold**.
  - **Capacity full or capped** → rest (a deliberate stop with a reason).

**Capacity throttle (instead of a dumb flat cap):**
- Broker tells us their real ceiling, e.g. "I can service 20 bookings/week" → stored as
  **booking capacity** on the account.
- The throttle watches **open bookings** (booked but not yet marked closed), not total
  bookings made.
- **Free capacity = capacity − open bookings.**
  - If open bookings = capacity → engine stops dialing/scraping for that account. Booking
    a 21st would just dump work on someone who can't handle it.
  - Broker works their meetings, comes into the dashboard, marks bookings **closed**
    (won / lost / no-show). Each close frees one slot → engine pursues exactly one new
    lead to fill it.
- Result: the system produces bookings at exactly the rate the broker can absorb. Their
  act of closing a booking is what pulls the next lead into the machine. Self-regulating.

**Two gaps to design around:**
1. **Broker must mark bookings closed or the machine seizes.** If they don't update,
   open bookings never clear, capacity stays at zero, engine goes silent. → Make closing
   a booking dead simple + nudge them (see §8).
2. **Define what "open" really means.** A no-show from 3 weeks ago shouldn't clog
   capacity forever. → "Open" = booked, meeting ahead or recently passed, awaiting
   outcome, with an **aging rule** that auto-flags/resolves stale ones.

**Schema additions for this:** `booking_capacity` on the account; a `bookings` table with
a broker-driven `status` (open → closed: won/lost/no-show). That status is the throttle's fuel.

---

## 8. Notification layer (locked for v1)

- **Resend**, fired from the existing daily loop (which already holds each broker's
  open-booking count).
- **Trigger on a meaningful condition, not every day.** The sharpest trigger: **at/near
  capacity** — "You're at 20 of 20. We've paused finding new leads until you close some
  out." That email has teeth because it ties their inaction to the thing stopping.
- **Email must drive the action:** deep link straight into their open-bookings view so
  closing one is ~2 clicks from the inbox.

---

## 9. Domain decision (locked timing)

- The app runs fine on the **free `.vercel.app` URL** — no domain needed for the app or
  webhooks.
- **Email is separate from the app URL.** To send broker-facing mail reliably you need a
  **verified sending domain** (DNS records prove you're allowed to send; without it Gmail
  junks/rejects it — that's how email works, not a Vercel/Resend rule).
- **Timing:**
  - *Now (build/test):* use Resend's test sender (`@resend.dev`). Wire up the code, confirm
    the nudge fires. No domain required. Lose nothing.
  - *Before the first real broker:* buy + verify a domain (~$10–15/yr). A throttle nudge
    in spam = the machine silently seizes. Also: mail from gmail/`resend.dev` undercuts a
    premium "done-for-you" pitch to US brokers. Domain = table stakes at launch, not at
    first line of code.

---

## 10. Build order (first → last)

The order follows the data, bottom-up. Each step is the input to the next.

1. **Schema** — `accounts` table + `account_id` on every table (leads, calls, bookings,
   opt-outs). Foundation everything reads.
2. **Engine, account-scoped** — rebuild every stage to run "for account X," reading
   settings, no hardcoded values.
3. **Seed tenant 0 + validate** — insert ourselves as account #1, run end-to-end, do the
   real dials.
4. **Internal ops dashboard** — account list, config panel, monitoring. Our cockpit.
5. **Auth + RLS** — Supabase Auth (email+password) + row-level security clamping every
   query to the logged-in `account_id`.
6. **Broker dashboard** — filtered, read-only, login-gated slice of the ops views +
   booking close/status controls.
7. **Onboarding flow** — create account → fill settings → flip active. Engine picks them
   up, dashboard works for them. No code per client.

**Starting point: Step 1 — the `accounts` schema.**

---

## 11. Open / to-decide

- Tavily vs Perplexity for web enrichment — pick one.
- Exact low-latency LLM for the live call (provider + model).
- Aging rule specifics for "open" bookings.
- Whether to add a pre-capacity gentle reminder email (vs only the at-capacity one).
