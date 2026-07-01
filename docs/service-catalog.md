# Reacher AI — Service Catalog (honest cut)

> One engine. On any call the agent only ever does what its **prompt** tells it, using the **ending tools** it's been given. So two "services" are only genuinely different if they change something the engine actually does — otherwise they're the same product wearing a different name, and we should never build or maintain them twice.

---

## What actually makes a service different

Only **three levers** change what the engine does:

1. **Direction** — inbound (they call us) or outbound (we call them).
2. **Ending** — what the agent may do at the end: **Book** a meeting · **Capture** information · **Answer** from the knowledge base. (Data-only services have no agent at all.)
3. **List / trigger** — who it works on: fresh prospects we find, a list the client uploads, the client's **own existing customers**, or appointment dates.

Everything else — "full pitch vs light pitch," "reactivation vs win-back," "confirmation vs no-show" — is **the script**. A script is a setting, not a separate service.

---

## The real engine modes (this is the whole machine)

| # | Mode | Direction | Ending | Typical list/trigger |
|---|------|-----------|--------|----------------------|
| 1 | **Outbound → Book** | out | Book | prospects, or the client's own contacts |
| 2 | **Outbound → Capture** | out | Capture | prospects or an uploaded list |
| 3 | **Appointment Reminders** | out | Book / Capture | appointment dates |
| 4 | **Inbound → Answer** | in | Book / Capture / Answer | inbound callers |
| 5 | **Data only (no agent)** | — | — | a list to find, clean, or enrich |

**Five modes.** Every offering below is one of these five with a list setting and a script on top.

---

## What we can honestly sell separately

Each heading is something a client would actually recognise and pay for as a distinct thing. "Merged in" = old names that were really the same engine.

### Mode 1 — Outbound, Book a meeting
- **Outbound Sales / Appointment Setting** — we call prospects and put meetings on the calendar.
  *Merged in:* **AI SDR** and **Appointment Setting** — identical engine; the only difference was how hard the agent pitches. That's one line in the script.
- **Reactivation & Renewals** — we call the client's **own** dormant or expiring contacts and book them back in.
  *Merged in:* **Database Reactivation** and **Renewals & Win-back** — same engine; both call a list the client already owns. Only the script angle differs.
  *Sold separately because:* different list (their warm contacts, not cold prospects) and a different buyer conversation. Genuinely its own thing.

### Mode 2 — Outbound, Capture answers
- **Lead Qualification** — we call leads, ask the qualifying questions, score them, hand back who's hot.
  *Same engine, different buyer:* **Survey / Market Research** (same call-and-record, research questions instead of sales ones) and **Recruitment Screening** (qualification + book an interview). These are the qualification engine with a different script — for screening, with booking switched on. Sell the name that fits the buyer; build it once.

### Mode 3 — Appointment Reminders
- **Appointment Reminders** — we call upcoming or missed appointments to confirm or rebook, cutting no-shows.
  *Merged in:* **Confirmation Calls**, **No-Show Recovery**, **Event Reminders** — one service, three scripts. The only real difference from Modes 1–2 is the trigger: it runs off appointment dates, not a lead list.

### Mode 4 — Inbound, Answer the phone
- **AI Receptionist** — answers, books, takes messages, answers FAQs.
  *Merged in:* **Business hours / After-hours / 24-7** — same agent; the hours are a setting.
- **Support / Complaint Line** — answers and logs the issue with a reference number; does **not** book.
  *Sold separately because:* this is the one genuine engine difference inside inbound — booking is turned off and it only captures.

### Mode 5 — Data only (no calling)
- **Lead Generation & Enrichment** — a clean, deduped list of target businesses with phone numbers, each researched (website, email, profile, fit, and optional buying-intent signal).
  *Merged in:* **ICP Prospecting** (same scrape, a sentence describing the ideal customer turns into search terms — a setting, not a service) **and Lead Enrichment** (2026-07-02: decided against selling separately — enrichment was never actually dependent on generation in the engine, it researches whatever's in the lead list whether that list was scraped here or brought/uploaded by the client. Generate and Enrich are two independent toggles on the same screen, not two products).
- **List Cleaning** — validate numbers, remove duplicates, scrub opt-outs, tag timezones.
  *Merged in:* those four were never separate — they're the steps that all run together when you clean a list.

### The bundle
- **Full Funnel / Done-For-You** — find leads → call and book → answer the callbacks. Mode 5 + Mode 1 + Mode 4 sold as one managed package. Not new tech; a premium wrapper.

---

## The honest count

- **Engine modes we actually build & maintain:** **5**.
- **Things we can sell as genuinely separate:** **8** (was 9 — Lead Generation and Lead Enrichment merged 2026-07-02, see Mode 5 above) — Outbound Sales · Reactivation & Renewals · Lead Qualification · Appointment Reminders · AI Receptionist · Support Line · Lead Generation & Enrichment · List Cleaning — **plus the Full Funnel bundle**.
- **Names that were never separate products** (now scripts/settings): AI SDR vs Appointment Setting · Database Reactivation vs Win-back · Survey · Recruitment Screening · the 3 reminder types · the 4 cleaning steps · the 3 receptionist hour-modes · ICP Prospecting · Lead Enrichment (a toggle on Lead Generation, not its own product).

> **5 real machines · ~8–9 things to sell · a pile of names that are just scripts on top.** Sell the names clients recognise; never pretend they're different products underneath.

---

## Mapping: what we sell → engine preset + script variant

The code already models exactly this — each sellable service is a preset, and the merged names are `script_variant`s of it (see `src/presets.ts`).

| Sellable service | Engine preset | Script variants (the "merged in" names) |
|------------------|---------------|------------------------------------------|
| Outbound Sales / Appt Setting | `outbound_sales` | default (AI SDR), `appointment_setting` |
| Reactivation & Renewals | `outbound_sales` | `db_reactivation`, `renewals_winback` (calls the client's own list) |
| Lead Qualification | `lead_qualification` | default, `survey_research`, `recruitment_screening` (+ booking) |
| Appointment Reminders | `ai_reminders` | `confirmation`, `no_show_recovery`, `event_reminder` |
| AI Receptionist | `inbound_receptionist` | hours via `calling_window` setting |
| Support / Complaint Line | `complaint_intake` | — (booking off, capture only) |
| Lead Generation & Enrichment | `lead_gen` + `lead_enrich` (both, stacked — generation and enrichment are independent toggles, not separate presets to choose between) | `icp_prospecting` (search terms from ICP text) |
| List Cleaning | `list_clean` | runs validate + dedupe + opt-out + timezone together |
| Full Funnel (bundle) | `lead_gen` + `outbound_sales` + `inbound_receptionist` | stacked |

> The onboarding UI should follow this: pick one of the **8 sellable services**, then a **script variant** where it has one, then the **list source** — not 20 separate buttons.
