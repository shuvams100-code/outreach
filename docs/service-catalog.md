# Reacher AI — Service Catalog (Ops-Facing)

> The 7 main services an ops person selects when onboarding a client. Each main service has sub-options (variations). Add-ons stack on top.

---

## 1. Answer My Phones
*Inbound voice — someone picks up when customers call*

| Sub-Option | What It Does | Engine Preset(s) |
|------------|--------------|------------------|
| **Receptionist (business hours)** | Answers, books appointments, takes messages, answers FAQ | `inbound_receptionist` |
| **After-Hours / Overflow** | Same agent, only nights/weekends/lunch | `inbound_receptionist` + `calling_window: after_hours` |
| **24/7 Coverage** | Same agent, all the time | `inbound_receptionist` + `calling_window: 24x7` |
| **Support Line** | Logs complaints with order ID, reassures follow-up, no booking | `complaint_intake` |

---

## 2. Call My Leads & Book Meetings
*Outbound voice — cold call and get appointments on calendar*

| Sub-Option | What It Does | Engine Preset(s) |
|------------|--------------|------------------|
| **AI SDR (full pitch → book demo)** | Cold calls, qualifies, books demos on calendar | `outbound_sales` |
| **Appointment Setting (just fill calendar)** | Lighter pitch, goal is only a booked slot | `outbound_sales` (script variant) |
| **Database Reactivation (old/dead leads)** | Calls dormant CRM list, re-engages, books | `outbound_sales` (script variant, client list) |
| **Renewals & Win-back (expiring contracts)** | Calls before expiry, saves or renews | `outbound_sales` (script variant, client list) |

---

## 3. Call My Leads & Qualify Them
*Outbound voice — call, ask questions, tell client who's hot*

| Sub-Option | What It Does | Engine Preset(s) |
|------------|--------------|------------------|
| **Lead Qualification (score & hand off)** | Calls, asks qualifying questions, tags qualified/unqualified | `lead_qualification` |
| **Survey / Research (ask my questions, give me data)** | Same flow, script is a survey | `lead_qualification` (script variant) |
| **Recruitment Screening (screen applicants, book interviews)** | Qualifies candidates, books interview slots | `lead_qualification` + `outbound_sales` (booking) |

---

## 4. Remind People of Appointments
*Outbound voice — prevent no-shows, recover missed*

| Sub-Option | What It Does | Engine Preset(s) |
|------------|--------------|------------------|
| **Confirmation Calls** | Calls upcoming appointments, confirms attendance | `ai_reminders` (script: confirm) |
| **No-Show Recovery** | Calls missed appointments, rebooks them | `ai_reminders` (script: rebook) |
| **Event / Webinar Reminders** | Calls registrants day-of, confirms attendance | `ai_reminders` (script: event) |

---

## 5. Find Me New Leads
*Data only — no calling agent*

| Sub-Option | What It Does | Engine Preset(s) |
|------------|--------------|------------------|
| **Lead Generation (clean list with phones)** | Scrapes Google Maps, Yellow Pages, Hotfrog, dedupes, enriches | `lead_gen` |
| **ICP Prospecting** | Client describes ideal customer → we turn into search terms & find them | `lead_gen` + ICP→search step |

---

## 6. Fix My Lead List
*Data only — clean up a list client already has*

| Sub-Option | What It Does | Engine Preset(s) |
|------------|--------------|------------------|
| **Phone Validation & Formatting** | Clean up numbers, standardize to E.164, flag invalids | `list_clean` (validation step) |
| **Deduplication** | Remove duplicates within list + against account's existing leads | `list_clean` (dedupe step) |
| **Opt-Out Scrub** | Remove numbers already on **this client's own** opt-out list | `list_clean` (opt-out check) |
| **Timezone Tagging** | Add timezone from area code so calling windows work | `list_clean` (timezone step) |

---

## 7. Do Everything (Full Funnel)
*Bundle — end-to-end managed service*

| Sub-Option | What It Does | Engine Preset(s) |
|------------|--------------|------------------|
| **Full Funnel Bundle** | We find leads (Lead Gen), call them (AI SDR), answer their callbacks (Receptionist) | `lead_gen` + `outbound_sales` + `inbound_receptionist` |

---

## Add-Ons (Stack on Any Voice Service)
*Checkboxes shown when a voice service (1-4, 7) is selected*

| Add-On | What It Adds | Engine Preset(s) |
|--------|--------------|------------------|
| **Also find me new leads** | Scrape & enrich targets for the campaign | `lead_gen` |
| **Also enrich my list** | Research each lead (website, email, profile, ICP fit) | `lead_enrich` |
| **Also clean my list** | Phone validation + dedupe + opt-out scrub + timezone tagging | `list_clean` |

---

## Combination Rules

| Primary Service (pick ONE) | Compatible Add-Ons |
|----------------------------|-------------------|
| Answer My Phones (any sub-option) | ✅ All three |
| Call My Leads & Book Meetings (any sub-option) | ✅ All three |
| Call My Leads & Qualify Them (any sub-option) | ✅ All three |
| Remind People of Appointments (any sub-option) | ✅ Enrich, Clean |
| Find Me New Leads (any sub-option) | *(standalone — no voice agent, no add-ons)* |
| Fix My Lead List (any sub-option) | *(standalone — no voice agent, no add-ons)* |
| Do Everything (Full Funnel) | *(already bundled — no add-ons needed)* |

---

## Mapping: Ops UI → Engine Presets

| Ops Selection | Engine Preset Key(s) | Notes |
|---------------|---------------------|-------|
| Receptionist | `inbound_receptionist` | |
| After-Hours | `inbound_receptionist` | + config `calling_window: after_hours` |
| 24/7 Coverage | `inbound_receptionist` | + config `calling_window: 24x7` |
| Support Line | `complaint_intake` | |
| AI SDR | `outbound_sales` | |
| Appointment Setting | `outbound_sales` | Script variant |
| Database Reactivation | `outbound_sales` | Script variant + client list |
| Renewals & Win-back | `outbound_sales` | Script variant + client list |
| Lead Qualification | `lead_qualification` | |
| Survey / Research | `lead_qualification` | Script variant |
| Recruitment Screening | `lead_qualification` + `outbound_sales` | Stacked |
| Confirmation Calls | `ai_reminders` | Script variant (new preset needed) |
| No-Show Recovery | `ai_reminders` | Script variant (new preset needed) |
| Event Reminders | `ai_reminders` | Script variant (new preset needed) |
| Lead Generation | `lead_gen` | |
| ICP Prospecting | `lead_gen` | + ICP→search step (small addition) |
| Phone Validation | `list_clean` | (new preset needed) |
| Deduplication | `list_clean` | (new preset needed) |
| Opt-Out Scrub | `list_clean` | (new preset needed) |
| Timezone Tagging | `list_clean` | (new preset needed) |
| Full Funnel Bundle | `lead_gen` + `outbound_sales` + `inbound_receptionist` | Stacked |

---

## Presets That Need to Exist in Code

### Current (6)
- `outbound_sales` ✅
- `lead_qualification` ✅
- `inbound_receptionist` ✅
- `complaint_intake` ✅
- `lead_gen` ✅
- `custom` ✅

### New / Renamed (to match this catalog)
- `ai_reminders` — **new** (Appointment Reminders base, 3 script variants)
- `list_clean` — **new** (Phone Validation + Dedupe + Opt-Out Scrub + Timezone Tagging)
- `lead_enrich` — **new** (Lead Enrichment standalone)
- `ai_sdr` — **alias** for `outbound_sales` (same tools, default script)
- `appointment_setting` — **alias** for `outbound_sales` (script variant)
- `db_reactivation` — **alias** for `outbound_sales` (script variant)
- `renewals_winback` — **alias** for `outbound_sales` (script variant)
- `lead_qual` — **alias** for `lead_qualification` (same)
- `survey_research` — **alias** for `lead_qualification` (script variant)
- `recruitment_screening` — **alias** for `lead_qualification` + `outbound_sales` (stacked)
- `inbound_receptionist` — keep (Receptionist)
- `after_hours` — **alias** for `inbound_receptionist` (config variant)
- `support_intake` — **alias** for `complaint_intake` (same)
- `lead_gen` — keep (Lead Generation)
- `icp_prospecting` — **alias** for `lead_gen` (config variant)
- `full_funnel` — **alias** for stacked `lead_gen` + `outbound_sales` + `inbound_receptionist`

---

## Implementation Notes

1. **Script variants** — Same preset key, different `script_variant` field in the preset config. The agent prompt loads the variant.
2. **Config variants** — Same preset key, different runtime config (e.g., `calling_window`). Set at account level.
3. **Stacked presets** — `applyPreset(accountId, ['lead_qualification', 'outbound_sales'])` composes tools + concatenates scripts.
4. **Data-only presets** (`lead_gen`, `lead_enrich`, `list_clean`) — No voice agent tools, no script. Just pipeline config.

---

## Next Steps for Backend

1. **Add `script_variant` field** to `Preset` type in `src/presets.ts`
2. **Add new presets**: `ai_reminders`, `list_clean`, `lead_enrich`
3. **Keep existing 6** as the base, add aliases/variants on top
4. **Seed a `service_catalog` table** (or JSON) with the ops-facing mapping above
5. **Update `applyPreset`** to handle `script_variant` and config variants