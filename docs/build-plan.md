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
| Enrichment | Regex first → LLM fallback (OpenRouter) → Tavily for gaps |
| Call orchestration | VAPI |
| Phone numbers + telephony | **VAPI native US/Canada numbers** (area-code selectable; one bill via VAPI). Twilio only later if ever needed (international / large rotating pools) |
| Speech-to-text | Deepgram |
| Text-to-speech | Deepgram Aura-2 (or Cartesia Sonic) |
| Booking | Google Calendar API |
| Notifications (internal) | Slack |
| Notifications (broker-facing) | Resend |
| Billing / payments | Dodo Payments (paid status drives the account's active switch) |

> **Resolved (was open):**
> - **Web enrichment = Tavily** (not Perplexity).
> - **Live-call LLM = VAPI's built-in models** — start with a fast, cheap option
>   (Groq Llama, ~200ms). VAPI bills per minute regardless of model ($10 free credit
>   on signup, then pay-as-you-go); no self-hosting a model for the call.
> - **Background enrichment LLM = a free model on OpenRouter** (not latency-sensitive).

---

## 4. What's customizable per account (the `accounts` settings)

Everything below is a **settings field** on the account. Everything else lives in the
engine.

**Client identity & contact**
- Business name
- Contact person's name
- Contact email — where booking alerts + the 3 reminder emails go (**required**)
- Contact phone
- Login email + password for their dashboard (maps the user → their `account_id`)
- Broker's own timezone — for showing meeting times + sending reminders (separate from
  the leads' calling-window timezone further down)

**Apify / scraping**
- Search query / business type
- Geography (city, state, radius, area codes)
- Which actor (Google Maps / LinkedIn / etc.)
- Lead cap per run + filters
- Scraping on/off (some brokers upload their own Excel instead)
- If scraping is off: the uploaded lead file + which columns map to name / phone / etc.
- Broker's own do-not-call / suppression list to import (numbers we must never dial)

**Enrichment**
- On/off
- What to research per lead + which fields get injected into the prompt
- Depth (light vs deep)

**Phone numbers (via VAPI — no Twilio)**
- Caller ID number(s) bought directly from VAPI, area-code matched to target geo
- Multiple numbers (for rotation) if needed — also from VAPI
- Branded caller-ID name (business name shown on the recipient's phone), if set up
- Broker's real number for warm transfers / callbacks
- *Why no Twilio:* buying numbers from VAPI keeps numbers + calling + per-minute billing
  on one bill. Importing Twilio numbers would add a second, separate Twilio bill for
  minutes. Twilio stays a later fallback only (international, or very large number pools).

**VAPI / the agent**
- System prompt / script template (with placeholders filled per call)
- First message (opening line)
- Voice ID
- The offer being pitched
- Qualifying questions
- Knowledge base about the broker (facts the agent uses to answer questions / handle
  objections — what they offer, years in business, licenses, rough pricing, etc.)
- Success definition (what counts as a booked appointment)
- Voicemail drop message (and whether to leave one at all)
- Max call duration, retry rules

**Booking the meeting**
- Connection to the broker's Google Calendar (so the engine can write events to it)
- Meeting length + buffer (e.g. 30 min, 15 min gap)
- The broker's availability windows (days/hours they actually take meetings)
- Meeting type (Google Meet link / phone / in-person address)
- Calendar/booking link given to the prospect
- Warm-transfer number (+ the hours the broker accepts live transfers)

**Account-level**
- Active / paused (our single master lever)
- Pricing tier + **billing status** (via **Dodo Payments**) — paid keeps the account
  active; a failed or cancelled payment auto-pauses it
- **Legal calling window** (account sets the hours once, e.g. 9am–6pm Mon–Fri) — but it is
  evaluated in **each lead's own timezone** (derived from the phone's area code), so a single
  account can target many regions. See §13.
- **Daily dial cap** — default **40 dials/day per phone number** (safely under the 50–75
  industry spam-flag threshold). It's a *per-number* safety rail: to scale volume, add
  another number (+40/day each), don't push one number harder. Note: spam risk is driven
  by *dialing* patterns, not by conversations — real answered calls actually help a
  number's reputation.
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
  etc. from our side — brokers don't touch prompt logic). **Laid out as the 7 settings
  buckets from §4.** Onboarding a client = create their account → fill the 7 buckets →
  flip Active. No code, ever — just a form.
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
   Crawl + enrich (regex → LLM → Tavily)  ──► state: new → enriched
        │
        ▼
   Compliance gate (opt-out list + calling hours, per account) ──► enriched → scrubbed
        │
        ▼
   VAPI call (account's prompt + voice + VAPI caller ID) ──► scrubbed → calling
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
2. **Define what "open" really means — DECIDED: no auto-free.** The system never
   auto-closes a meeting. If a broker ignores every reminder, the engine simply waits
   and keeps nudging, but books nothing new for that broker until they manually mark
   the meeting closed. Closing is 100% the broker's responsibility; a stalled machine
   is the intended consequence (a forcing function to keep brokers engaged).

**Schema additions for this:** `booking_capacity` on the account; a `bookings` table with
a broker-driven `status` (open → closed: won/lost/no-show). That status is the throttle's fuel.

---

## 8. Notification layer (locked for v1)

- **Resend**, fired from the existing daily loop (which already holds each broker's
  open-booking count).
- **Three broker-facing email triggers (DECIDED):**
  1. **New meeting booked** — "You've got a new meeting" (the booking notification).
  2. **One hour before the meeting** — reminder to the broker. *(Separate from, and in
     addition to, the engine's AI reminder call to the prospect ~1hr before — both kept.)*
  3. **Meeting time has passed and it's still not marked closed** — wait 24h, then email
     "please mark this meeting closed." This is the nudge that frees a stuck capacity slot.
- **No auto-close (see §7):** the after-meeting email keeps nudging, but the system never
  closes a meeting itself — the broker must do it, or their machine stays paused.
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

## 11. Open / to-decide — ALL RESOLVED

- ~~Tavily vs Perplexity for web enrichment~~ → **Tavily.** (§3)
- ~~Exact low-latency LLM for the live call~~ → **VAPI built-in model, start with Groq
  Llama (~200ms).** Background enrichment LLM = a free OpenRouter model. (§3)
- ~~Aging rule for "open" bookings~~ → **No auto-free; broker must mark closed, engine
  waits.** (§7, §8)
- ~~Pre-capacity reminder email?~~ → Replaced by the **three-trigger email plan**:
  new-booking, 1hr-before, and after-meeting close nudge. (§8)
- **Added since v1:** **Dodo Payments** for billing — paid status drives each account's
  active switch. (§3, §4)

---

## 12. Cost & limits (reality check)

- **What costs money:** only live *conversations* (talk minutes) — roughly
  **$0.08–0.12/min** all-in on the cheap setup (Groq brain + Deepgram voice + VAPI fee +
  telephony). Ringing, no-answer, and busy signals are effectively free.
- **What triggers spam flags:** *dialing* patterns per number — NOT conversations. Real
  answered calls actually improve a number's reputation.
- **Per-number dial cap = 40/day** (safely under the 50–75 industry threshold). Scale by
  adding numbers (+40/day each), not by overloading one.
- **₹2,000 budget (≈ $21 at ₹94.7/$, Jun 2026):** roughly **~700 dials / ~140 real
  conversations** over 30 days. With VAPI's **$10 signup credit** (~$31 total): about
  **~1,000 dials / ~200 conversations**. At ~25 dials/day, the **budget runs out long
  before spam is ever a risk**.
- **Bookings:** the most variable number — depends on script, offer, and list quality.
  Rough early gut-feel: ~5–15 booked meetings per ~140 conversations, improving as the
  script is tuned during tenant-0 testing.

---

## 13. Stage 2 engine — locked detail spec (the if/else rules)

> Visual version of all of this: **[flow.html](flow.html)** (open in a browser — renders as flowcharts). This section
> is the written source of truth; where it differs from earlier high-level lines, this wins.

**State machine (now with `disqualified`):**
`new → enriched → scrubbed → calling → booked / not_interested / no_answer`, plus a terminal
`disqualified` (junk or opted-out — never dialed, never billed).

**Enrichment chain (Stage 2.2)** — three rungs, stop when one works:
1. **Regex** the website for an email — free.
2. **Free LLM reads the website** → first/last name, a **detailed profile** (what they do, who
   they serve, specialties, a talking angle), `is_broker`, and timezone — free. Model:
   `gpt-oss-120b` primary, **DeepSeek V4** fallback (exact `:free` IDs confirmed at build).
3. **Tavily web search** — **default final fallback**, only fires when the site is missing/thin.
   Rare in practice, so the free 1,000/mo pool lasts; upgrade as tenant volume grows.
- `is_broker = false` → `disqualified`. Else save profile + `state = enriched`.

**Names:** capture first/last when the site names a person; otherwise the call greets the
**business** and asks who it's speaking to live (greeting is a template on `first_message`).

**Multi-region (per-lead timezone):** each lead's timezone is derived from its phone **area
code** (free static map) and stored on `leads.timezone`. The account sets calling hours once;
the engine checks them in **each lead's local time** → one account, many regions, no extra config.

**Compliance gate (Stage 2.3):** `enriched → scrubbed` if the phone is **not** on the opt-out
list (else `disqualified`). Weekend / US-federal-holiday / hours are checked at **dial time**,
not here. Holidays come from **Nager.Date** (free, no key) cached in a `holidays` table that
**auto-refreshes each new year** (fetch-on-first-miss). Weekends are computed from the date.

**Daily run + dialing (Stage 2.5/2.7):** for each active account, in its calling rules' time:
stop on weekend / holiday / outside-hours. Then fill the **40-dial cap** in order —
(1) retries due (`no_answer`, tries<3, due now) capped at **40% = 16/day** (overflow rolls to
tomorrow); (2) ready `scrubbed` leads for the remainder; (3) only if still short **and** below
`refill_threshold`, scrape fresh ground. Dials are **spread across the working day**, not bursted.

**Retry policy:** 3 attempts, flat **3-day** gap. After 3 → exhausted (stays `no_answer`,
drops out of the queue, appears in the follow-up list). Stored in `accounts.retry_rules` =
`{ max_attempts: 3, gap_days: 3, max_share_of_daily_cap: 0.40 }`.

**Scraping (Stage 2.5/2.7) — multi-source from line one:** a single coordinated run per area
**fans out to all enabled sources in parallel** (Google Maps base, Yelp, Yellow Pages, web-search;
+ customer CSV; LinkedIn optional enrichment-only; social excluded — no phones), normalizes each to
the common lead shape, **merges and dedupes by phone**, tags `leads.source`. Scrape the **full
sweep** of an area (not 50) up to `lead_cap_per_run` (default **500**); the 40/day is only the
*dial* cap. Each source bills for its own results, so the **source set is a per-account setting**
(`accounts.sources` jsonb — budget tenant = Maps only, premium = all); dedupe means research +
calling are paid **once per unique business**. No source has an exclusion list, so **`scrape_runs`**
logs every mined (source + term + area) and the engine always aims at fresh ground; post-scrape
phone-dedupe is the backstop so the DB never bloats.

**Client type & ingestion (B2B vs B2C):** onboarding asks the client's business name, then **who
their customers are** → `accounts.customer_type` (b2b | b2c). **B2B** (targets businesses) →
scraping + CSV both available (toggle). **B2C** (targets the general public) → scraping **OFF** by
default, **CSV upload only** — the public can't be scraped, and AI-voice consumer calling needs
**prior written consent** (TCPA + national Do-Not-Call; FCC 2024 covers AI voices). B2C brokers
bring consented lists (CRM / opt-in web-form / purchased opt-in). **Source-agnostic ingestion:**
scraped or uploaded, every lead runs through one normalization step (→ standard lead shape, dedupe
by phone, save as `new`), so the pipeline downstream is identical. **DNC scrubbing + consent
tracking** join the compliance gate (§2.3) once any B2C account exists.

**Manual follow-up:** a `manual_followup` **view** (`state=no_answer AND retry_count>=3`) joining
`leads` + `calls` → first/last name, phone, company, times called, call dates, business profile.
Read/export it for offline email/LinkedIn; fully separate from the calling system.

**New Supabase objects for Stage 2:** `disqualified` enum value · `holidays` table ·
`scrape_runs` table (with a `source` column) · `manual_followup` view · `leads.timezone` column ·
`accounts.sources` jsonb (multi-source list, replaces single `apify_actor`) ·
`accounts.customer_type` (b2b/b2c — drives scraping default) · populate tenant-0
`retry_rules` + `lead_cap_per_run`.
