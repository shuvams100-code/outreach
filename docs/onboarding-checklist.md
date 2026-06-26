# Reacher AI — Client Onboarding Checklist

> **How to onboard a client:** create their `accounts` row, fill the fields below, and flip `status = active`. The engine picks them up automatically. Nothing in the code changes per client — only this database row.
>
> Not every field applies to every client — it depends on their **direction** (inbound / outbound / both) and **input pipes**. Each field notes when it's needed.
> Fields marked `*(not yet added)*` need to be added to the Supabase database schema when that build step lands.

---

## 1. Identity & Contact (Always Required)

| Field | Column | Type | Status | Notes |
|---|---|---|---|---|
| Business name | `business_name` | text | ✅ In Schema | Displayed in booking pages and emails |
| Contact person | `contact_name` | text | ✅ In Schema | Client contact's name |
| Contact email | `contact_email` | text | ✅ In Schema | **Required** for booking alerts + nudges |
| Contact phone | `contact_phone` | text | ✅ In Schema | Client contact's phone |
| Client timezone | `timezone` | text | ✅ In Schema | Used to format meeting times for the client |
| Dashboard login | *(Auth record)* | — | 🟡 Pending | Linked via Supabase Auth mapping |

---

## 2. Direction & Access Control

| Field | Column | Type | Default | Status |
|---|---|---|---|---|
| Outbound calling | `outbound_enabled` | bool | true | 🟡 Pending `*(not yet added)*` |
| Inbound answering | `inbound_enabled` | bool | false | 🟡 Pending `*(not yet added)*` |

---

## 3. Ingestion & Input Pipes

| Field | Column | Type | Status | Notes |
|---|---|---|---|---|
| Customer Type | `customer_type` | text (`b2b \| b2c`) | ✅ In Schema | `b2b` allows scraping; `b2c` disables scraping (upload only) |
| Enabled Pipes | `sources` | jsonb | ✅ In Schema | Array of active pipes, e.g. `[{"key":"upload","enabled":true}]` |
| Upload Mapping | `upload_mapping` | jsonb | 🟡 Pending `*(not yet added)*` | Maps CSV column headers to contact fields |
| Upload: Website column | *(auto-mapped from CSV)* | — | ✅ Live | If the uploaded file has a `website`/`url`/`site` column and enrichment is on, that lead is researched before calling (agent walks in informed). Optional but recommended for B2B lists. |
| Enrichment on/off | `enrichment_enabled` | bool (default true) | ✅ In Schema | Drives both scraping enrichment AND upload enrichment (uploaded leads with a website get researched when true). |
| Scraper Query | `search_query` | text | ✅ In Schema | Business category to search (e.g. "insurance broker") |
| Scraper City | `geo_city` | text | ✅ In Schema | Target city for scraping |
| Scraper State | `geo_state` | text | ✅ In Schema | Target state (two-letter code) |
| Scrape Lead Cap | `lead_cap_per_run` | int | 🟡 Pending `*(not yet added)*` | Max scraped records per Apify run |

---

## 4. ICP & Qualification Filter (used by ALL enrichment — scraping + uploaded-with-website)

> This **replaced** the old hardcoded "is it an insurance broker?" check in the engine. The LLM now
> judges each researched lead against the account's own `icp_description`; a lead that doesn't fit is
> marked `disqualified` (never called). Leave it blank → no filtering (every researched lead is kept).

| Field | Column | Type | Status | Example (Tenant-0) |
|---|---|---|---|---|
| ICP Description | `icp_description` | text | ✅ **In Schema (added 2026-06-26)** · tenant-0 set | "Independent insurance brokers and small/independent agencies. NOT national carriers, captive agents, or unrelated businesses." |
| Excluded Names | `exclude_names` | jsonb | 🟡 Pending `*(not yet added)*` | Array of name patterns to drop at ingestion, e.g. `["Geico", "State Farm"]` |

---

## 5. Voice Agent (VAPI Config — Both Directions)

| Field | Column | Type | Status | Notes |
|---|---|---|---|---|
| Assistant Config | `vapi_assistant` | jsonb | ✅ In Schema | Full assistant payload (contains script prompt, model settings, and voice options). **Per-lead context is injected automatically at call time** — if a lead has a `business_profile` (from enrichment), the engine appends it as a system message so the agent knows who it's calling. No per-account config needed. |
| Caller-ID Number IDs | `vapi_phone_numbers` | jsonb array | ✅ In Schema | VAPI phone number IDs to call from (dial cap is per number) |
| Inbound Number IDs | `vapi_inbound_numbers` | jsonb array | 🟡 Pending `*(not yet added)*` | Numbers the agent answers |

---

## 6. Calling & Retry Rules (Outbound)

| Field | Column | Type | Default | Status |
|---|---|---|---|---|
| Daily Dial Cap | `daily_dial_cap` | int | 40 | ✅ In Schema (dial cap per phone number) |
| Retry Rules | `retry_rules` | jsonb | `{"max_attempts":3,"gap_days":3,"max_share":0.4}` | ✅ In Schema (retry cap, interval, and cap-share) |
| Calling Hour Start | `calling_hours_start` | text | "09:00" | ✅ In Schema (Mon-Fri start time in lead timezone) |
| Calling Hour End | `calling_hours_end` | text | "18:00" | ✅ In Schema (Mon-Fri end time in lead timezone) |
| Scraper Refill Gate | `refill_threshold` | int | 50 | 🟡 Pending `*(not yet added)*` | Backlog count below which scraping is triggered |

---

## 7. Booking & Calendar Core

| Field | Column | Type | Default | Status |
|---|---|---|---|---|
| Calendar Auth | `google_calendar_credentials` | jsonb | — | 🟡 Pending `*(not yet added)*` |
| Meeting Duration | `meeting_duration_minutes` | int | 30 | 🟡 Pending `*(not yet added)*` |
| Meeting Buffer | `meeting_buffer_minutes` | int | 15 | 🟡 Pending `*(not yet added)*` |
| Meeting Room Link | `meeting_link` | text | — | 🟡 Pending `*(not yet added)*` |
| Booking Capacity | `booking_capacity` | int | — | 🟡 Pending `*(not yet added)*` |

---

## Minimum Launch Criteria (Before Status → Active)

### Outbound Client Setup:
1. Contact email (`contact_email`) populated.
2. At least one outbound phone number ID (`vapi_phone_numbers`) added.
3. VAPI assistant JSON payload loaded with active prompt and voice.
4. Calling hours and dial caps defined.
5. Calendar connection credentials saved.
6. Target booking capacity set.
7. Active input source configured (CSV mapping or scraper search/geo parameters).
8. For B2C clients: verify that the uploaded list is consented (TCPA compliance check).

### Inbound Client Setup:
1. Contact email (`contact_email`) populated.
2. At least one inbound number ID (`vapi_inbound_numbers`) registered.
3. VAPI assistant payload configured.
4. Calendar credentials and booking capacity established.
