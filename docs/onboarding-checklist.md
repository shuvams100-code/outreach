# Outreach.ai — Client Onboarding Checklist

> **How to onboard a client:** create their `accounts` row, fill the fields below, flip
> `status = active`. The engine picks them up automatically. Nothing in the code changes
> per client — only this data row.
>
> Not every field applies to every client — it depends on their **direction** (inbound /
> outbound / both) and **input pipes**. Each field notes when it's needed.
> Fields marked *(not yet added)* get added to the schema when that build step lands.

---

## 1. Identity & Contact (always)

| Field | Column | Type | Notes |
|---|---|---|---|
| Business name | `business_name` | text | — |
| Contact person | `contact_name` | text | — |
| Contact email — booking alerts + 3 reminder emails | `contact_email` | text | **required** |
| Contact phone | `contact_phone` | text | — |
| Client's own timezone (for displaying meeting times) | `timezone` | text | — |
| Dashboard login (Supabase Auth → account_id) | *(Auth record)* | — | Step: Auth |

---

## 2. Direction — what service they're buying *(not yet added)*

| Field | Column | Type | Default |
|---|---|---|---|
| Outbound calling on/off | `outbound_enabled` | bool | true |
| Inbound answering on/off | `inbound_enabled` | bool | false |

> A client can run either or both. Drives which engine paths apply to them.

---

## 3. Input pipes — how their contacts enter

> Only fill the pipe(s) the client uses. `customer_type` gates whether scraping is even available.

| Field | Column | Type | Notes |
|---|---|---|---|
| Who their customers are | `customer_type` | `b2b \| b2c` | b2b = can scrape businesses · b2c = upload only |
| Enabled sources | `sources` | jsonb | e.g. `[{"key":"upload","enabled":true}]` |
| **Upload:** column mapping (which CSV cols = name/phone/email) | `upload_mapping` *(not yet added)* | jsonb | for CSV/list upload pipe |
| **Web-form:** capture webhook URL/secret | `form_webhook` *(not yet added)* | jsonb | Phase 2 |
| **Scraping (B2B only):** search query | `search_query` | text | which businesses to find |
| **Scraping:** geography | `geo_city` / `geo_state` | text | target area |
| **Scraping:** lead cap per run | `lead_cap_per_run` *(not yet added)* | int | default 500 |

---

## 4. Qualification / ICP — optional, per pipe *(not yet added)*

> Replaces any hardcoded "is it a broker" check. Only needed when a pipe brings unfiltered
> leads (e.g. scraping). A clean uploaded list usually needs none.

| Field | Column | Type | Example (tenant-0) |
|---|---|---|---|
| What's a good lead (fed to enrichment AI) | `icp_description` | text | "independent insurance broker or agency, not a national carrier" |
| Name blocklist — dropped at ingestion | `exclude_names` | jsonb | `["Geico","State Farm","Liberty Mutual", …]` |

---

## 5. The AI Agent — script & voice (both directions) *(mostly not yet added)*

> The same agent config drives outbound calls AND the inbound assistant.
> Prompt/first-message use `{{placeholders}}` filled per call from contact data.

| Field | Column | Type | Notes |
|---|---|---|---|
| System prompt / call script | `vapi_system_prompt` | text | — |
| Opening line | `vapi_first_message` | text | outbound greeting (inbound has its own) |
| Voice ID | `vapi_voice_id` | text | — |
| Knowledge base — facts the agent answers from | `vapi_knowledge_base` | text | services, pricing, hours, etc. |
| Qualifying questions / success definition | `vapi_success_criteria` | text | what counts as a booked meeting |
| Voicemail drop message (outbound) | `vapi_voicemail_message` | text | — |
| Leave voicemail on/off | `vapi_leave_voicemail` | bool | default true |
| Max call duration (seconds) | `vapi_max_duration_seconds` | int | default 300 |

---

## 6. Phone Numbers (VAPI — no Twilio) *(not yet added)*

> **Dial cap is per number.** To scale outbound volume, add numbers — never raise the cap.
> Example: 120 calls/day → 3 numbers, 40 each. Inbound has no cap (reactive).

| Field | Column | Type | Default |
|---|---|---|---|
| Outbound caller-ID number IDs | `vapi_phone_numbers` | jsonb array | — |
| Inbound number(s) the agent answers | `vapi_inbound_numbers` *(not yet added)* | jsonb array | — |
| Branded caller-ID name shown to recipient | `vapi_caller_id_name` | text | — |
| Warm-transfer / callback number | `transfer_phone` | text | — |
| Warm-transfer hours | `transfer_hours` | jsonb | — |
| Daily dial cap **per number** (outbound) | `daily_dial_cap` | int | 40 |

---

## 7. Calling Rules (outbound) *(not yet added)*

> Evaluated in **each lead's local timezone** (from area code), so one account targets many regions.

| Field | Column | Type | Default |
|---|---|---|---|
| Calling window start (lead local, Mon–Fri) | `calling_hours_start` | time | 09:00 |
| Calling window end | `calling_hours_end` | time | 18:00 |
| Retry rules | `retry_rules` | jsonb | `{"max_attempts":3,"gap_days":3,"max_share":0.4}` |
| Refill threshold (scrape/refill when ready leads drop below N) | `refill_threshold` | int | 50 |

---

## 8. Booking (both directions) *(not yet added)*

| Field | Column | Type | Default |
|---|---|---|---|
| Google Calendar connection (OAuth) | `google_calendar_credentials` | jsonb | — |
| Meeting length (min) | `meeting_duration_minutes` | int | 30 |
| Buffer between slots (min) | `meeting_buffer_minutes` | int | 15 |
| Meeting type | `meeting_type` | text | `google_meet` |
| Public booking link given to prospects | `booking_link` | text | — |
| Max open bookings the client can handle | `booking_capacity` | int | — |

---

## 9. Account Control (always)

| Field | Column | Type | Default |
|---|---|---|---|
| Active / paused (master lever) | `status` | `active \| paused` | paused |
| Billing status — paid = active (Dodo webhook) | *(Dodo writes this)* | — | Step: billing |

---

## Required minimum before flipping active

**Outbound client:** `contact_email` · ≥1 `vapi_phone_numbers` · agent prompt + first message + voice ·
`calling_hours_*` · `booking_capacity` · calendar connection · at least one input pipe configured
(upload mapping, or scraping search+geo for B2B).

**Inbound client:** `contact_email` · ≥1 `vapi_inbound_numbers` · agent prompt + voice ·
`booking_capacity` · calendar connection.

**B2C clients:** consented list imported + DNC scrubbing/consent tracking in place before activating
(TCPA — see build-plan.md §11).
