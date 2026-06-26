# Reacher AI — Exhaustive Use-Case Map

> What this single codebase can be sold as. The engine is horizontal: a multi-tenant voice agent
> (outbound + inbound) + lead-gen (scrape/enrich/dedup) + calendar booking + compliance. Each "service"
> below is the **same engine** with a different **ending** (what the agent does at the end of a call)
> and sometimes a different **trigger** (what starts it). Nothing here is industry-locked.

## What's already built (the shared spine — 0% rework, reused by everything)
- Outbound calling (any script/voice, per-account) · Inbound answering
- Conversation + qualification (LLM agent) · per-lead context injection (agent knows who it's calling)
- **Ending that exists today: book a meeting** (live calendar check + book, in/out)
- Lead-gen: scrape (Google Maps / Yellow Pages / Hotfrog) + enrich (per-account ICP) + dedup
- Compliance (DNC/opt-out, calling windows, per-lead timezone), retries, daily caps
- Reminder calls, Slack alerts, multi-tenant settings

## The "ending tools" that unlock everything else (build once, reuse across many services)
| Ending tool | Unlocks |
|---|---|
| `capture_fields` (save structured answers) — ✅ **BUILT** | qualification, surveys, research, screening, intake |
| `take_message` | receptionist, after-hours |
| `transfer_to_human` (warm transfer) | receptionist, support, high-intent sales |
| `answer_from_kb` (knowledge base) | FAQ deflection, Tier-1 support |
| `send_link` (SMS/email a link) | review generation, payment, info send |
| `log_ticket` | complaint intake, helpdesk |
| web-form capture + instant-call | speed-to-lead |

Rework key: **Ready** = sellable now · **Small** (~10%) = one ending tool · **Medium** (~30%) = ending + a new channel/integration · **Large** (~50%+) = deep integration / regulated.

---

## A. Outbound voice services
| Service (industry name) | What the client gets | Rework |
|---|---|---|
| **AI SDR / Outbound Sales** | Cold-calls prospects, pitches, qualifies, books demos on their calendar | **Ready** (this is tenant-0) |
| **Appointment Setting** | Calls a list and fills the calendar with booked meetings | **Ready** |
| **Done-For-You Campaign** | Scrape → enrich → call → book, fully managed end to end | **Ready** |
| **Database Reactivation** | Calls old/dormant leads to re-engage and rebook | **Ready** (just a list + script) |
| **Lead Qualification** | Calls leads, asks qualifying Qs, scores & tags, hands off qualified ones | **Small** — `capture_fields` |
| **Recruitment Screening** | Calls applicants, screens to criteria, books interviews | **Small** — `capture_fields` (book already works) |
| **Appointment Reminders / Confirmations** | Calls upcoming appts to confirm; cuts no-shows | **Small** — confirm/reschedule capture (reminder call exists) |
| **No-Show Recovery** | Calls missed appointments to rebook | **Small** |
| **Renewals & Win-back** | Calls expiring subscriptions/policies to renew or save | **Small** |
| **Event / Webinar Reminders** | Calls registrants to confirm attendance | **Small** |
| **Survey & Market Research** | Calls a list, asks a script, records structured answers | **Small** — `capture_fields` |
| **Review Generation** | Calls happy customers, asks for a review, texts the link | **Medium** — `capture_fields` + `send_link` (SMS) |
| **Payment / Collections Reminders** | Calls about overdue invoices, sends a pay link | **Medium** — `send_link` + heavier compliance |
| **Waitlist Fill** | When a slot opens, calls the waitlist to fill it | **Medium** — trigger + booking (booking exists) |

## B. Inbound voice services
| Service (industry name) | What the client gets | Rework |
|---|---|---|
| **Inbound Appointment Booking** | Answers the line and books callers onto the calendar | **Ready** (inbound + booking live) |
| **Inbound Lead Capture / Inbound Sales** | Answers inbound inquiries, qualifies, books or routes | **Small** — `capture_fields` |
| **AI Receptionist** | Answers, gives info, takes messages, routes calls | **Medium** — `take_message` + `transfer_to_human` |
| **After-Hours / Overflow Answering** | Catches calls staff miss; books or messages | **Medium** — same endings as receptionist |
| **Tier-1 Support / FAQ Deflection** | Answers common questions from the client's knowledge base | **Medium** — `answer_from_kb` (knowledge_base field exists) |
| **Complaint / Ticket Intake** | Logs complaints/tickets with details for follow-up | **Medium** — `log_ticket` |
| **Call Screening & Routing** | Screens callers, forwards the right ones to a human | **Small–Medium** — `transfer_to_human` |
| **Order Taking / Status** | Takes simple orders or gives order status | **Large** — order capture + system integration |

## C. Data-only services (the lead-gen base, no calling required)
| Service (industry name) | What the client gets | Rework |
|---|---|---|
| **Lead Generation (lists)** | A deduped list of target businesses with phones | **Ready** — add an export |
| **ICP Prospecting** | Define ideal customer → get matching businesses found | **Small** — ICP→search-terms step |
| **Lead Enrichment** | Send a list, get each researched (profile, website, email) | **Small** — expose enrichment standalone |
| **List Cleaning / DNC Scrubbing** | Cleans/validates phone lists, removes opt-outs | **Small** — expose compliance standalone |

## D. Vertical packaging (SAME engine, niche branding — marketing, ~0% code)
Insurance, Real Estate, Solar, Mortgage/Loans, Home Services (HVAC/roofing), Dental/Med-spa, Auto,
Fitness, Legal intake, Recruiting agencies. Each is just the **AI SDR / Appointment Setting / Receptionist**
service with a niche name, a tuned script, and the matching ICP. **Zero new code** — pure positioning.

> Regulated verticals (healthcare/HIPAA, financial/collections-TCPA) are **Large** — they add consent,
> data-handling, and audit requirements on top of the engine.

---

## Settings idea to support this (near-term)
A free-text **ICP box** on the account ("describe your ideal customer in 2–4 lines"). The backend already
has `icp_description` and the enrichment AI already uses it to *judge fit*. The next step is letting that
same text **drive the search** — an LLM turns the ICP into the scrape search terms — so onboarding is:
write the ICP → toggle sources → done. **Small** addition (one LLM step: ICP text → `search_query`).
