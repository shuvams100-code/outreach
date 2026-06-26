# Reacher AI — Product Document

> What we actually built, told straight: what it is, how the agents work together, every service we can
> sell **today** (nothing aspirational — only what the current code does), the pain each one kills, and
> what to charge for it.

---

## 1. What this is, in one breath

**Reacher AI is a managed AI voice service.** A business signs up, we configure one settings record, and
from then on an AI agent makes their outbound calls and/or answers their inbound calls — having a real
conversation and, at the end, doing one of a few useful things: **booking a meeting**, **capturing
information** (an answer, a complaint, a callback, a qualification), or **answering a question** from what
it knows about the business. It can also **find and clean the leads** to call in the first place.

It is **horizontal** — not built for one industry. Brokers, dentists, solar installers, recruiters, law
firms: same engine, different settings row. Nothing is ever hardcoded per client.

Underneath, everything the system can do reduces to **four real capabilities**:

| Capability | What it means | Built |
|---|---|---|
| **Talk** | Call out, or answer in — a real conversation, any script, any voice | ✅ |
| **Book** | Check a live calendar and book a meeting mid-call | ✅ |
| **Capture** | Save structured info from the call (qualification, survey, complaint, callback, message) | ✅ |
| **Know** | Answer questions about the client's business from its knowledge base | ✅ |
| **Find** | Scrape, dedupe, research and clean leads to call | ✅ |

Every service below is just a **packaging** of these. That's the whole point — one engine, many products.

---

## 2. The story of one call — how the agents hand off

Picture a new client: a solar company that wants more booked consultations. Here's what happens, and who
does what. (Each name is a real file in the codebase — one specialist, one job.)

It starts with **the Profiler**. The client typed two lines describing their ideal customer —
"homeowners' associations and property managers in Texas." The Profiler reads that and works out the
exact search term to hunt for. It hands that to **the Scout**, who fans out across three lead sources
(Google Maps, Yellow Pages, Hotfrog) and drags back a pile of matching businesses. The Scout is careful:
it throws away the paid ads and the obvious national chains, and it refuses to grab the same business
twice — checking every phone number *and* every website against everything already in the system.

The survivors pass to **the Guardian**, the bouncer at the door. Anyone on a do-not-call list is turned
away on the spot. The rest go to **the Sleuth**, the researcher. The Sleuth visits each business's
website, reads it, and — using a free AI model with a backup if the first is busy — writes a short profile:
what they do, who they serve, and a hook to open the call with. If there's no website, it searches the web
instead. And it's honest: if it genuinely can't find anything, it leaves the lead alone rather than
pretending it succeeded.

Now there's a clean, researched list sitting in **the Vault** — the shared memory every agent reads and
writes. Each morning **the Dispatcher** wakes up and decides who actually gets called today. This is the
brains of the operation: it checks the client is active and paid, stops dialing if their calendar is
already as full as they can handle, then builds the day's list — yesterday's missed calls first (but never
more than 40% of the day, so old misses don't crowd out fresh leads), then new leads to fill the rest. And
it only calls each lead when it's a *legal, sensible* moment for **that specific person** — a weekday, not
a US holiday, inside business hours **in their own timezone**.

For each chosen lead, **the Herald** places the call — and quietly stamps it with who it's for, so nothing
gets confused later. Just before the agent speaks, **the Ghostwriter** slips it two things: everything we
know about this business (the Sleuth's research) and the client's own knowledge base. So **the Voice** —
the agent the prospect actually hears — walks in already knowing who it's talking to and able to answer
questions about the solar company.

The conversation happens. When the prospect says "yeah, I'd take a look," the Voice reaches for its tools.
**The Quartermaster** hands them over — but first it makes absolutely sure *which* client this call belongs
to (so a booking can never land on the wrong calendar; if it can't tell, it refuses rather than guess).
Then **the Timekeeper** reads the real calendar for genuinely open slots, offers them, and **the Concierge**
books the chosen one — creating the event, attaching the meeting link and reminders — right there, live, on
the call. If instead the prospect had a question, a complaint, or wanted a callback, **the Scribe** would
write it all down instead of booking.

The second a meeting books, **the Crier** announces it to the team on Slack. The host's calendar will remind
them automatically. And about an hour before the meeting, **the Nudge** calls the prospect to confirm they're
still coming — quietly cutting no-shows.

When the call ends, **the Arbiter** judges what happened. Booked? Done. No answer? It schedules a retry in
three days and tries again — up to three times before handing the lead off to a manual follow-up list. Not
interested? Closed cleanly. And the loop tightens itself: every open booking counts against the client's
capacity, and when they mark a meeting won, lost, or no-show, a slot frees up and the Dispatcher gets back
to work.

Meanwhile, two side doors stay open. **The Catcher** catches leads from the client's own website form (they
just paste our URL into their form). **The Switchboard** is the public front door for *inbound* calls — when
someone rings the client's number, it routes them straight to the Voice, same booking and capturing tools in
hand. And **the Archivist** can hand the whole lead list back as a clean spreadsheet any time.

That's the system. Twenty specialists, one conversation, no human touching code.

---

## 3. The cast — every agent

| Agent | Role |
|---|---|
| **Profiler** | Turns the client's plain-English ICP into the search terms to hunt |
| **Scout** | Finds businesses across Google Maps, Yellow Pages & Hotfrog; drops ads; never grabs a dupe |
| **Porter** | Brings in leads from an uploaded CSV / Excel list |
| **Catcher** | Catches leads from the client's web form (their form → our URL) |
| **Sleuth** | Researches each lead — website + AI — into a short profile and talking hook |
| **Guardian** | The compliance gate — removes opt-out / do-not-call numbers |
| **Dispatcher** | Decides who gets called today: caps, retries, timezones, holidays, capacity |
| **Herald** | Places each outbound call and runs the full cycle |
| **Ghostwriter** | Briefs the agent before every call — business knowledge + lead research |
| **The Voice** | The agent the customer actually talks to |
| **Switchboard** | The public front door — answers inbound calls, receives web-form leads |
| **Quartermaster** | Hands the Voice its tools mid-call; makes sure the call maps to the right client |
| **Timekeeper** | Reads the real calendar for open slots |
| **Concierge** | Books the meeting, live, during the call |
| **Scribe** | Writes down answers — qualification, survey, complaint, callback, message |
| **Arbiter** | Judges the finished call and decides retry / booked / not-interested |
| **Nudge** | Calls the prospect ~1h before the meeting to confirm |
| **Crier** | Announces every booking to the team on Slack |
| **Archivist** | Exports the lead list as a clean spreadsheet |
| **Vault** | The shared memory every agent reads and writes |

---

## 4. What we can sell — the services catalog

**Pricing note:** figures are USD for the US / Western small-business market, where these services
command real money. *Setup* is a one-time onboarding fee (provision number, tune script & voice, connect
calendar, load knowledge base, configure sources). *Retainer* is monthly. Prices scale with **how much
machinery a service burns** — inbound/reactive services are cheap to run; outbound services that also do
lead-gen + research + high call volume cost more to deliver, so they carry more. (For the Indian SMB
market, scale roughly 40–55% of these.)

> Cost reality that makes this work: a live talk-minute costs ~$0.08–0.12, scraping ~$0.003/lead, the AI
> research is free-tier. So gross margins sit around **80–90%** — almost everything billed is profit.

### A. Outbound services (we dial out)

| Service | The pain it kills | Powered by | Setup | Retainer / mo |
|---|---|---|---|---|
| **AI Appointment Setting (SDR)** | Sales reps burn hours dialing; pipeline is thin and inconsistent | Profiler · Scout · Sleuth · Dispatcher · Voice · Concierge | $500–$1,500 | $1,200–$2,500 (or $50–$80 / booked meeting) |
| **Lead Qualification** | Reps waste time on junk leads that were never a fit | Voice · Scribe | $400–$1,000 | $900–$1,800 |
| **Database Reactivation** | A CRM full of old leads quietly rotting | Porter · Voice · Concierge / Scribe | $300–$800 | $600–$1,200 (or per-project) |
| **Outbound Surveys / Market Research** | Calling customers for feedback is slow and expensive | Voice · Scribe | $300–$800 | $500–$1,200 |
| **Appointment Reminders / Confirmations** | No-shows quietly bleed revenue | Nudge · Voice · Scribe | $250–$600 | $300–$700 |
| **Recruitment Screening** | Recruiters drown in repetitive first-round calls | Voice · Scribe · Concierge | $400–$900 | $800–$1,600 |
| **Web-form Follow-up** | Web leads sit untouched for hours and go cold | Catcher · Voice · Concierge | $300–$700 | $500–$1,000 |

### B. Inbound services (we answer)

| Service | The pain it kills | Powered by | Setup | Retainer / mo |
|---|---|---|---|---|
| **AI Receptionist** | Missed calls = missed money; nobody to answer the phone | Switchboard · Voice (+knowledge) · Concierge · Scribe | $300–$900 | $300–$600 |
| **After-Hours / Overflow Answering** | Calls after 5pm and on weekends hit a dead line | Switchboard · Voice · Concierge · Scribe | $300–$700 | $300–$600 |
| **Inbound Appointment Booking** | Callers want to book; the front desk is slammed | Switchboard · Voice · Timekeeper · Concierge | $300–$800 | $400–$800 |
| **Inbound Lead Capture / Inbound Sales** | Ad & web callers ring in and nobody qualifies them | Switchboard · Voice · Scribe · Concierge | $400–$900 | $500–$1,000 |
| **Complaint / Support Intake Line** | Complaints get lost; customers feel ignored | Switchboard · Voice · Scribe | $300–$700 | $400–$700 |
| **FAQ / Info Line** | Staff answer the same questions all day | Switchboard · Voice (+knowledge) | $250–$600 | $300–$500 |

### C. Data-only services (no calling)

| Service | The pain it kills | Powered by | Setup | Price |
|---|---|---|---|---|
| **Lead Generation (lists)** | No pipeline, nothing to call | Profiler · Scout · Guardian · Archivist | — | $0.15–$0.40 / lead, or $300–$800 / batch |
| **Lead Enrichment** | A bare list (just names & numbers) with no context | Sleuth | — | $0.20–$0.60 / lead |
| **List Cleaning / DNC Scrubbing** | Calling un-scrubbed lists is legally risky | Porter · Guardian | — | $0.05–$0.15 / number, or $150–$400 / list |

---

## 5. The one-click presets (multi-select)

Onboarding picks one **or several** of these and the system auto-configures itself (which tools the agent
gets, whether it scrapes, the script, the success definition). The human only fills the client-specific bits
(phone number, calendar, knowledge base, ICP).

| Preset | Category | The agent's "ending" | Sells as |
|---|---|---|---|
| **Outbound Sales** | outbound | Book a meeting | Appointment Setting / SDR |
| **Lead Qualification** | outbound | Capture answers + fit score (no booking) | Qualification / Surveys / Screening |
| **AI Receptionist** | inbound | Answer · book · take a message | Receptionist / After-hours |
| **Complaint Intake** | inbound | Capture the complaint + order ID | Support / Complaint line |
| **Lead Generation** | data | (no calling) scrape → dedupe → enrich → export | Lead lists / Enrichment / Scrubbing |
| **Custom (blank)** | custom | nothing pre-filled — toggle by hand | Anything bespoke |

**Sales vs Qualification — why they're separate (and priced differently):** both qualify, but Sales ends in
a **booked meeting** (high-value outcome → higher fee), while Qualification ends in **captured, scored
answers** handed back to the client's own reps to close (lower fee — they still do the closing).

### Selling more than one service (bundling)

Presets stack. A client wanting multiple services is handled one of two ways:

- **Path 1 — one agent, combined.** For *compatible* jobs (e.g. a receptionist that also does outbound
  follow-up). Pick multiple presets → the engine unions the tools and layers the scripts into one agent on
  one number. **Quote = the higher retainer + a small uplift.**
- **Path 2 — separate agents.** For *distinct personas* (e.g. an outbound sales line AND a separate inbound
  complaint line). Spin up two account configs under the same client — two numbers, two sharp agents (the
  multi-tenant model already supports one client → many accounts). **Quote = stack the retainers, ~10–15%
  bundle discount, one setup fee per number.**

Rule of thumb: **compatible combo → compose (Path 1); genuinely different personas → separate agents (Path 2).**
A single agent trying to be both a salesperson and a complaint desk is never as sharp as two focused ones.

---

## 6. How to think about pricing

Three levers set the number:

1. **How much it costs to run.** Inbound is reactive and light — the phone only rings when a real customer
   calls. Outbound with lead-gen burns scraping + research + lots of talk-minutes, so it costs more and
   prices higher.
2. **How valuable the outcome is.** A booked sales meeting is worth a lot to the client, so appointment
   setting commands the top of the range. A logged complaint is valuable but lower-stakes, so it sits lower.
3. **The pricing model.** Retainer (predictable) or pay-per-result (a price per booked meeting / per
   qualified lead). Pay-per-result is the easiest first sale — the client risks nothing until you deliver.

Because the cost to deliver is tiny, even the bottom of every range is highly profitable. The constraint
on revenue is never the cost — it's how many clients you can sign.

---

## 7. Honest status (so the doc never oversells)

Everything above is **built and tested** — the engine, the agents, the booking, the capture, the lead-gen,
the presets, the compliance, the multi-tenancy (40+ automated tests passing). What remains before the first
paying client is the **deploy step**: putting the server online (so the booking tools work on live calls),
proving one real end-to-end call, and connecting billing. Until that's done, these are capabilities the
system *has*, not calls it has *made*. The deploy is the bridge from "built" to "earning."
