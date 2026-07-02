# Reacher AI — Service Catalog (honest cut)

> One engine. On any call the agent only ever does what its **prompt** tells it, using the **ending tools** it's been given. So two "services" are only genuinely different if they change something the engine actually does — otherwise they're the same product wearing a different name, and we should never build or maintain them twice.

---

## 2026-07-02: outbound calling removed entirely

AI-generated voice calls are "artificial voice" calls under the TCPA — calling a cell phone with one requires prior express written consent, no B2B carve-out, and scraped/uploaded cold leads have no consent basis. Outbound Sales / Appointment Setting, Reactivation & Renewals, Lead Qualification, Appointment Reminders & Recovery (the old standalone version), and List Cleaning are gone — not deprioritized, deleted (code, presets, UI). Full reasoning in `docs/design-log.md` (2026-07-02).

One calling capability survived, redesigned around actual consent: **No-Show Reduction**, a paid add-on inside AI Receptionist (not a standalone service) — see below.

---

## What actually makes a service different

Only **three levers** change what the engine does:

1. **Direction** — inbound (they call us) only now. No agent ever initiates a call to someone who hasn't already reached out or explicitly consented on a live call.
2. **Ending** — what the agent may do at the end: **Book** a meeting · **Capture** information · **Answer** from the knowledge base. (Data-only has no agent at all.)
3. **List / trigger** — who it works on: inbound callers, or (data-only) a list to find and research.

---

## The real engine modes

| # | Mode | Direction | Ending | Typical list/trigger |
|---|------|-----------|--------|----------------------|
| 1 | **Inbound → Answer** | in | Book / Capture / Answer | inbound callers |
| 2 | **Data only (no agent)** | — | — | a list to find and research |
| — | **No-Show Reduction** (add-on, not a mode of its own) | out, but consent-gated | Book (reschedule) | bookings the caller consented to being reminded about, made through Mode 1 |

**Two real modes**, plus one narrowly-scoped consent-gated calling feature layered on top of Mode 1.

---

## What we can honestly sell separately

### Mode 1 — Inbound, Answer the phone
- **AI Receptionist** — answers, books, takes messages, answers FAQs.
  *Merged in:* Business hours / After-hours / 24-7 — same agent; the hours are a setting.
  *Add-on, priced separately:* **No-Show Reduction** — after booking, the agent asks the caller for permission to call back an hour before as a reminder (offering to reschedule if they can't make it). Only ever fires for callers who said yes, live, on that call — informational-call consent under the TCPA, not telemarketing, so oral consent is sufficient. Consent is captured per-booking and carries forward automatically on reschedule. Scoped to Receptionist bookings only — cannot be extended to outbound win-back calling, which is exactly the removed non-consented case.
- **Support / Complaint Line** — answers and logs the issue with a reference number; does **not** book.
  *Sold separately because:* the one genuine engine difference inside inbound — booking is turned off and it only captures.

### Mode 2 — Data only (no calling, no TCPA exposure — no call is ever placed)
- **Lead Generation & Enrichment** — a clean, deduped list of target businesses with phone numbers, each researched (website, email, profile, fit, optional buying-intent signal). Two independent toggles (generate, enrich) on one screen — not two products, and enrichment isn't dependent on generation (it works on any lead, scraped or uploaded).
  *Merged in:* ICP Prospecting (a sentence describing the ideal customer turns into search terms — a setting) and Lead Enrichment (2026-07-02: decided against selling separately, see above).

---

## The honest count

- **Engine modes we actually build & maintain:** **2**, plus the No-Show Reduction add-on.
- **Things we can sell as genuinely separate:** **3** — AI Receptionist (+ optional No-Show Reduction add-on) · Support / Complaint Line · Lead Generation & Enrichment.
- **Names that were never separate products** (now scripts/settings, or removed): the 3 receptionist hour-modes · ICP Prospecting · Lead Enrichment (a toggle, not its own product) · everything that used to be Outbound Sales / Reactivation / Lead Qualification / Appointment Reminders / List Cleaning — removed, not merged.

> **2 real machines + 1 consent-gated add-on. Sell the names clients recognise; never pretend they're different products underneath — and never bring back outbound calling on scraped/uploaded leads without a real consent story.**

---

## Mapping: what we sell → engine preset

| Sellable service | Engine preset | Notes |
|------------------|---------------|-------|
| AI Receptionist | `inbound_receptionist` | No-Show Reduction is an account-level flag (`accounts.reminders_addon_enabled`) + per-booking consent (`bookings.reminder_consent`), not a preset — see `docs/mock-and-wiring.md` |
| Support / Complaint Line | `complaint_intake` | booking off, capture only |
| Lead Generation & Enrichment | `lead_gen` + `lead_enrich` (both, stacked — generation and enrichment are independent toggles) | `icp_prospecting` (search terms from ICP text) — label only, data-only presets have no script |

> The onboarding UI follows this: pick one of the **3 sellable services**, then the list source / add-on where it has one.
