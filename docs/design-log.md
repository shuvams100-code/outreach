# Design Log — Internal Ops Dashboard

A running record of every visual/design decision: colors, shapes, components, type, spacing. Newest entries at the top. When something changes, log the old value → new value and why.

---

## 2026-07-02 (correction: bundled lead-gen must be automatic, not manual)

### "Manual only" from the entry below was one part of the answer, not all of it
- User caught a gap: "manual" is right when service 7 is bought **standalone** (client wants a list handed over) — wrong when scraping is chosen as the lead source **inside an active calling service** (Outbound Sales / Reactivation / Lead Qualification). In the bundled case, the calling agent has nothing to dial unless generation+enrichment feed it, so it can't depend on someone remembering to click a separate button.
- **Correction to my own earlier claim:** I'd said calling already has "real cron automation" via `daily.ts`/`runDailyAccount` and only scrape/enrich lacked it. Checked — that's wrong. There is no cron/scheduler anywhere in the repo for anything; `runDailyAccount` is only ever invoked by hand today (`scripts/daily-tenant0.ts`, tenant-0 only). Both docs corrected (here and `mock-and-wiring.md`).
- **Built:** `runDailyAccount` (`daily.ts`) now auto-chains `scrapeAccount` → `enrichAccount` → `scrubAccount` before selecting the day's call list, when the account has an active calling service AND `scraping_enabled` AND the `scrubbed` backlog is below `refill_threshold`. This is the **Scraping Refill Guard** already speced in `docs/build-plan.md` (§4.4) but never actually wired up until now — found the exact spec while investigating this, so implemented it as-designed rather than inventing a new rule. Refill failures are caught (`refillError` in the return) so a bad scrape never blocks dialing the existing backlog.
- **Standalone case unaffected:** an account with only "Lead Generation & Enrichment" active has no calling service, so it never reaches `runDailyAccount` — stays exactly as manual as built below, on purpose.

---

## 2026-07-02 (services 7+9 merged; buying-intent added)

### Service 7 — "Lead Generation" and "Lead Enrichment" merged into one service, "Lead Generation & Enrichment"
- **Decision (product):** enrichment was never actually dependent on generation in the backend — `enrichAccount()` enriches whatever's in `leads` with `state: 'new'`, regardless of whether it got there via scrape or CSV upload. Splitting them into two sellable services implied a false dependency. Merged into one card: service 9 removed, service 7 renamed "7. Lead Generation & Enrichment" (`docs/service-catalog.md`'s "9 sellable services" and its `lead_enrich` row are now stale — count is 8, flagged there too).
- **New config screen built** for `configuringService === "Lead Generation"` (was a "coming soon" placeholder) — two independent toggles, not a forced pipeline: **"2. Generate New Leads"** (city/state/radius/business type, source chips — any combination, leads-per-run cap) and **"3. Enrich Leads"** (depth select), either can run alone or together.
- **Manual only for the standalone case** — see the correction entry above for the bundled-with-calling case, which is automatic.
- **New Section 1 field: "Buying Intent Signal"** (optional, free text) — sits beside ICP. ICP = who to target (static fit); this = what recent, observable sign proves they need it *now* (e.g. "posted a job for a delivery driver"). Reuses the enrichment step's existing Tavily+LLM call (one more field in the same JSON response) rather than adding a new data source or API call — zero new spend.
- **Soft signal by decision, not a gate:** a lead with no intent evidence is NOT disqualified — `fits_icp` alone still decides `enriched` vs `disqualified`. `intent_match`/`intent_evidence` are tag/rank-only. Reasoning: LLM intent-reads off short site/search text are noisier than the existing ICP-fit check, so gating on it risked silently starving the pipeline of real, fit leads. Recorded as a user-confirmed decision (asked directly, "soft signal" chosen over "hard filter").
- **Backend:** `accounts.intent_signal_description` (new column), `leads.intent_match` / `leads.intent_evidence` (new columns) — see `docs/mock-and-wiring.md` for the wiring detail.

---

## 2026-07-01 (copy sweep + real backend)

### Copy fix: removed implementation-status leaks from ops-facing text
- "Connect a calendar" note under Appointment Reminders read *"Mock connection only. In production, this hooks into the client's live calendar feed."* — exposed internal build status to what should read as a normal product screen. Changed to *"Syncs live with the client's calendar once connected."* Swept the rest of the file for similar language (stub/simulate/fake/hardcoded/etc.) — nothing else needed fixing; the remaining "coming soon" notes (voice preview, the 3 unbuilt services) are honest and left as-is.
- **Backend wiring** for the account + service lifecycle (onboarding, edit, enable/disable, activate/save-draft/deactivate/delete for all 6 built services) is now real, not mock — full detail and verification notes in `docs/mock-and-wiring.md` (not duplicated here since it's engineering, not a visual decision).

---

## 2026-07-01 (Appointment Reminders config)

### Service 4 — Appointment Reminders (built by Antigravity, reviewed)
- Shared-form extended for "Appointment Reminders". New "Appointment Source & Reminder Timing" section replaces the lead/ICP section: reminder type (Confirmation / No-Show Recovery / Event Reminder), 3 sources (auto-remind our booked meetings **[gated on an active Outbound/Reactivation booking service]**, connect calendar, upload list), and timing (value + unit, label adapts before/after).
- Offer, Lead Enrichment card, and Scraper Sources card hidden; variant dropdown hidden; Meeting section kept (rebooking); no B2B/B2C scrape gate (no scraping). Activates without a required meeting. Defaults + save/load + summary detail all present.
- **Fix on review:** timing unit now normalizes when switching reminder type (No-Show Recovery uses minutes/hours; others hours/days) so the select never goes out of sync.
- Auto-link is opt-in, never mandatory — reminders can run standalone (calendar/upload) or linked to booked meetings. Backend note (tracker): the reminder sweep must be gated to accounts that bought the service + enabled the link.

---

## 2026-06-30 (Lead Qualification config)

### Service 3 — Lead Qualification config built (reuses the shared form)
- Extended the shared config form to handle "Lead Qualification" alongside Outbound Sales / Reactivation.
- **New "Qualifying Questions" section** (lead-qual only): Qualify-vs-Survey segmented choice, add/remove question rows, a "what counts as qualified" box (hidden in Survey mode), and a **Recruitment screening toggle** (Qualify mode only) that reveals the Meeting section + switches the agent to the screening/booking script.
- **Differences from Outbound:** endings are capture-only (no booking); Offer field hidden; Meeting section hidden unless recruitment is on; success metric = "qualification answers captured"; the Agent&Script variant dropdown is hidden (the qualify/survey choice lives in the Questions section).
- Activate gating relaxed: lead-qual activates without a meeting (capture-only); requires a meeting only when recruitment is on. New fields persist in `serviceConfigs` and load back; the active-service summary shows mode / question count / script preview.
- Maps to `accounts.qualifying_questions` (mock for now). Build ✓, eslint 0 errors.

---

## 2026-06-30 (B2B/B2C gate)

### Target-customer-type field gates scraping + enrichment (legal)
- **Onboarding** now has a required "Who does this client sell to?" choice — **Businesses (B2B)** / **Consumers (B2C)** (two-card selector, validated). Stored as `targetCustomerType`.
- **Outbound config gating (consumer = restricted):** Scrape lead-source disabled (note: "Scraping is only for B2B — upload instead"); Enrichment card shows a locked "not for consumers" note instead of the toggle; the **Lead Generation** card in the service picker is greyed/blocked for consumer clients.
- **Backend (authoritative, REAL):** added `accounts.target_customer_type` column; `scrape.ts` (`scrapeAccount`) and `enrich.ts` (`enrichAccount`) now refuse to run unless the account is explicitly `business` (unset/consumer → skipped). This is the real legal guard — UI is just the first layer.
- Harbor set to `business` (demo keeps scrape/enrich). Tenant-0 backfilled to `business`.

---

## 2026-06-30 (config screen — editable + voicemail off)

- **Advanced "Configured ✓" cards made editable** (were all `readOnly` hardcoded): Retry & Pacing (attempts/gap/cap), Enrichment (on + depth dropdown), Scraper Sources (toggleable chips), Call Limits (max length/leads). New state + saved into `serviceConfigs`.
- **Voicemail card rewritten** — the old "Leave voicemail if unanswered ✓" was wrong and money-wasting. Now states: "No voicemail is ever left — agent hangs up on a machine." Matches the engine (which never leaves one). Added an explicit comment in `src/call.ts` that `leave_voicemail`/`voicemail_message` columns are intentionally unused + a verify-TODO that VAPI hangs up on detection.
- **Compliance card** locked properly (`disabled`, not `readOnly` which checkboxes ignore) and labelled "(always on)".
- Model dropdown flagged as mock in the tracker (real source = VAPI model list; default `gpt-4o-mini`).

---

## 2026-06-30 (service config screen — review + fixes)

### Outbound Sales config screen (built by Antigravity, reviewed)
- 7-section pre-templated config form under `create-service` (Agent & Script, Endings, Who it calls, Offer & Knowledge, The Meeting, Phone Pool, Footer), + active-service summary card + "coming soon" placeholder for the other 8. Build passes, eslint 0 errors.
- **Fixes applied on review:**
  - `handleActivateService` / `handleDeactivateService` were calling `setOnboardedClient` **inside** the `setClients` updater (nested state update) and **mutating** `c.serviceConfigs` in place. Rewrote both to compute the updated client once and clone `serviceConfigs` — no mutation, single update.
  - Phone capacity label hardcoded "× 40" while summing each number's editable cap → showed wrong math if a cap changed. Now reads "{N} numbers = {total} dials/day."
- **Note (not fixed):** the script-variant dropdown under Outbound Sales lists `db_reactivation` + `renewals_winback`, which the catalog assigns to the separate "Reactivation & Renewals" service. Engine-valid (both are `outbound_sales` variants) but overlaps service #2 — decide whether to drop them here.

---

## 2026-06-30 (account toggle + derived status)

### Enable/disable toggle drives the Status pill
- Added an **account enable/disable toggle** next to the name's pencil (green ON / grey OFF, sliding knob). OFF disables the whole client (e.g. on non-payment).
- **Status pill now derives** via `clientStatus(c)`: toggle OFF → **Disabled** (red); ON + no live service → **Onboarded** (slate); ON + ≥1 active service → **Active** (green). Replaces the hardcoded "New". The active-service branch lights up once the service flow exists.
- Mock for now (`enabled` + `activeServices` are client fields in local state); ponytail comment flags it needs the accounts table to persist.

---

## 2026-06-30 (breadcrumb path + vivid meta)

### Service header — colored path + multi-color meta pills
- **Breadcrumb is now a path** in our accent: `‹ Back` and the client name in `#4F46FF`, separators light, and the **last segment** (the current service) in a lighter "selected/open" pill (`#F4F5FF` bg, `#4F46FF` text). Timezone removed from the path — it isn't a path node. Last segment shows **"New Service"** for now; wire it to the actual service name once a service exists.
- **Meta line → colored pills**, one design-system hue each (Status green `#10B981`, Industry purple `#8B5CF6`, Timezone cyan `#06B6D4`, Contact indigo `#4F46FF`, Email amber `#F59E0B`, Phone pink `#EC4899`), each on its tint. Replaces the all-black "Label: value | …" row so the header reads vivid, not flat.

---

## 2026-06-30 (edit moves to a pencil)

### Service header — pencil-edit beside the name, top-bar Edit removed
- Removed the top-bar **Edit details** button. Edit now lives as a small **pencil icon button** (30px, outline, hover → accent) directly beside the client name. Click → same `startEditOnboarding` popup.
- Name + pencil sit in a left group; **Add Service** stays right; the whole row is `alignItems: center` so name, pencil, and Add Service line up on one row.
- Shadcn not used — the project is fully inline-styled with no shadcn/Tailwind-component setup; kept consistent with the existing system.

---

## 2026-06-30 (service page actions)

### Create Service — edit details + cleaner top bar
- **Top bar on this page only:** removed the notification bell and the "Back to Dashboard" button. In their place, one **Edit details** button (pencil) that reopens the onboarding popup pre-filled with the client's data.
- **Edit mode** (`editingClientId` state): the same onboarding modal/form is reused; **Save changes** patches the existing client in place (keeps id/color/score/billing) and **closes the popup immediately — no success screen, no navigation**; the page's details just update. Modal chip/heading/subtitle and the button switch to edit wording; Cancel clears edit mode.
- **Breadcrumb `‹ Back`** returns to the **Client Directory**.

---

## 2026-06-30 (service header restyle)

### Create Service header → service-detail anatomy
- Reworked the Step-2 header to mirror a service-detail page (reference: EY Mobility Pathway), in our tokens: **breadcrumb** (`‹ Back | {client} › {timezone}`, Back → directory), eyebrow chip, **big 22px title** = business name, and an **inline meta status line** with `|` separators (Status: New · Industry · Timezone · Contact · Email · Phone). The colored avatar (18px) stands in for the reference's country flag.
- Replaced the previous bordered card + 4-field grid. Skipped the reference's tab row (Summary/Approval/…) — nothing to tab between yet; add when the service form has sections.

---

## 2026-06-30 (dedup pass)

### Extracted two repeated frontend blocks into components
- **`ClientIdentityCell`** — the avatar + name + "Score% · Onboarded" first table cell, was byte-identical in the dashboard and directory client tables. Now one component used in both.
- **`TimeframeDropdown`** — the "Overall Sales" and "Revenue & Cost" cards had two ~83-line identical timeframe selectors (only the state var differed). Now one component; caller passes value/onChange/open/setOpen/ref. Revenue option font normalized 11px→12px to match. `page.js` ~3448 → ~3292 lines.

---

## 2026-06-30 (directory → service setup)

### Click a registered client → open its Create Service page
- Rows in **All Registered Clients** (directory view) are now clickable (`cursor: pointer`, "Open service setup" tooltip): click sets `onboardedClient` to that client and switches to the `create-service` view. Fixes being locked out of Step 2 after skipping it post-onboarding.
- Step-2 header values made tolerant of the manually-seeded clients (which lack split contact fields): Contact/Email/Phone/Timezone fall back to "—", and Phone falls back to the combined `contact` field.

---

## 2026-06-30 (Step 2 header)

### Create Service — populated client header + blank body
- After **Proceed**, the submitted client is stored (`onboardedClient` state) and Step 2 opens showing it.
- **Header card** (full-width, white, `#ECEEF2` border, 12px radius, `20px 24px` pad): left = avatar tile (48px, client color, initials) + business name (16px/600) + "industry · acc_id" subline; right = a row of labelled fields (Contact · Email · Phone · Timezone), labels 10px uppercase `#A0A6B4`, values 12px `#1F2433`. Timezone rendered via `TIMEZONE_LABEL()`.
- **Below the header: intentionally blank** (placeholder dashed box + "Finish later" button removed) — reserved for the upcoming 7-service picker. Navigation handled by the top-bar "Back to Dashboard".
- Container widened to full width (`maxWidth 920px → width 100%`) so the header spans the screen.

---

## 2026-06-30 (onboarding → modal)

### Onboarding is now a popup, not a screen
- **"Add Organization" no longer navigates** to a full `add-organization` view. It opens a centered modal over the current screen (`showOnboardModal` state). The background blurs — overlay is `position: fixed; inset: 0; zIndex: 1000; background: rgba(17,24,39,0.35); backdropFilter: blur(4px)`.
- **Modal card:** white, `borderRadius: 16px`, `padding: 28px`, `maxWidth: 640px`, `maxHeight: 90vh` (scrolls), shadow `0 24px 60px rgba(31,36,51,0.25)`. Keeps the Step-1 chip + heading; separator dropped (the card is its own boundary).
- **Form back to 2 columns** (modal is narrower than the full screen): Business name · Contact name / Contact email · Contact phone / Client timezone · Industry. Buttons pulled out of the grid into a normal bottom row, right-aligned.
- **Buttons:** Cancel (closes the modal + resets fields) and **Proceed** (renamed from "Save"). Proceed still validates, then on success closes the modal and goes to Step 2 (`create-service`).

---

## 2026-06-30 (timezone dropdown)

### Client timezone — native select → custom dropdown
- **Replaced the native `<select>`** (the "2000s" browser dropdown, and slightly taller than sibling inputs) with the codebase's custom dropdown pattern (same as the Revenue "Log Payment → Client" picker): a clickable div trigger + popover list.
- **Now matches the other fields exactly:** identical padding `10px 12px 10px 36px`, 12px font, `#ECEEF2` border (→ `#4F46FF` when open, `#EF4444` on error), 8px radius, clock icon on the left, chevron on the right that rotates 180° when open. `boxSizing: border-box` so height lines up with the text inputs.
- **Popover:** white, `#ECEEF2` border, 8px radius, soft shadow `0 8px 24px rgba(31,36,51,0.08)`, grouped (North America / Europe / Asia-Pacific / Other) with 10px uppercase `#A0A6B4` group headers. Options hover `#F7F8FA`; selected = `#4F46FF` on `#F4F5FF`, weight 600. Closes on outside-click (added `timezoneRef` to the shared mousedown handler) and on pick.
- Timezone options moved to a module-level `TIMEZONE_GROUPS` constant + `TIMEZONE_LABEL()` helper.

---

## 2026-06-30 (layout pass 2)

### Onboarding form — 4-column rearrange
- **Grid 3 → 4 columns**; container now full width (`width: 100%`, removed the `maxWidth` cap that left empty space on the right and narrowed the boxes). The 4 fields now stretch equally across the whole row.
- **Row 1:** Business name · Contact name · Contact email · Contact phone (phone pulled up from row 2 into the empty 4th slot).
- **Row 2:** Client timezone · Industry · (gap) · Cancel+Save. Buttons moved *into* the grid as a spanning item (`gridColumn: 3 / 5`, `justifyContent: flex-end`, `alignItems: flex-end`) so they sit pinned bottom-right on the same line as timezone/industry instead of on their own row below.

---

## 2026-06-30 (flow)

### Onboarding → Create Service (Step 2)
- **Save now advances to Step 2**, not back to the dashboard. After the success interstitial (subtitle changed "Redirecting to dashboard..." → "Loading service setup..."), `currentView` switches to new `create-service` view.
- **New view `create-service`** ("Create Service" / "Step 2 of 2 · Choose service"). Reuses the same heading-accent (`#4F46FF`), separator, and step-chip pattern as Step 1. Top-right action becomes "Back to Dashboard"; top-bar title/subtitle handle the new view.
- **Placeholder body:** dashed `#D5D9E2` box on `#FBFBFD`, grid icon in a `#F4F5FF` tile, "Service selection coming next" — stands in until the 7-service picker is built. One "Finish later" button (returns to dashboard).

---

## 2026-06-30 (layout pass)

### Onboarding screen — heading, separator, 3-col form
- **Page heading colored:** the top-bar title "Onboard Organization" is now accent `#4F46FF` (was `#1F2433`) — only on this screen; other views keep `#1F2433`. Makes it read as the screen's heading.
- **Separator added:** 1px `#ECEEF2` divider between the top-bar heading and the form section (first child of the add-organization block, `marginBottom: 4px`).
- **Form is now 3 columns** (was 2): `repeat(3, 1fr)`, gap `18px 20px`. Container widened `maxWidth 600px → 920px` so the columns breathe.
- **Field order:** Row 1 = Business name · Contact name · Contact email. Row 2 = Contact phone · Client timezone · Industry. Cancel/Save buttons sit left-aligned below, 20px gap above (form flex gap).

---

## 2026-06-30

### Onboarding screen — scope + framing
- **Reframed as a step:** added an eyebrow chip "Step 1 of 2 · Client details" (10px, weight 700, uppercase, `#4F46FF` text on `#F4F5FF` pill, radius 6px) above the heading. Subtitle changed to "Tell us who this client is. Next, you'll set up the service their AI agent runs." — signals the Create Service screen comes next, so the form no longer reads as a dead-end.
- **New field — Industry** (optional, free text). Placed second in the grid (after Business name). Building/factory SVG icon, placeholder "e.g. Insurance, Real Estate, Dental". Maps to the existing `accounts.business_type` column. Grid is now 6 fields = 3 clean rows of 2.
- **Billing deliberately NOT added here.** Money has one home — the Revenue screen's Log Payment ledger. The dashboard's retainer/Paid-Unpaid should reflect the latest logged payment, not a field set at onboarding. Avoids two sources of truth.

---

## 2026-06-28 (build fix)
- **Build error fixed:** "Unterminated regexp literal" at line 210 caused by orphaned chart JSX left over from a failed reorder. Rewrote `frontend/app/page.js` cleanly as a single pass — sidebar + top bar + KPI grid + chart (left half). No more duplicate chart block.

---

## 2026-06-28

### KPI Cards (new)
- **4 cards:** Total Active Clients · Calls Placed Today · Meetings Booked Today · Connect Rate
- **Layout:** 4-column grid, `gap: 12px`, `margin-top: 24px` below the top bar
- **Card style:** white `#FFFFFF`, border `1px solid #ECEEF2`, `border-radius: 12px`, padding `16px 18px`
- **Highlight card** (Meetings Booked): `2px solid #4F46FF` border, value in `#4F46FF` — matches mockup pattern
- **Value size:** 26px, weight 600, color `#1F2433` (except highlighted card)
- **Label:** 11px, `#8A90A0`, with a small SVG icon

---

### Search bar — interactive behavior (new)
- **Click/focus → expands** from 432px to 560px. Animation: `max-width 320ms cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out, was `160ms ease` linear-ish). Border turns accent `#4F46FF` when active.
- **Empty + open:** shows "Recent searches" list (clock icon, mock entries). Clicking one fills the box.
- **Typing:** recent list is replaced by live autocomplete; filters mock clients by **name / account ID / email**.
- **Dropdown panel:** white `#FFFFFF`, border `#ECEEF2`, radius 10px, soft shadow `0 8px 24px rgba(31,36,51,0.08)`.
- **Result row:** client name (weight 500) + email (`#8A90A0`) on left, account ID (`#A0A6B4`) on right.
- **No match:** "No clients found" muted message.
- Mock client data used for now; to be replaced by a Supabase query.

### Buttons
- **Primary button color:** `#6366F1` → `#4F46FF` (more vibrant, same indigo hue). Used on the "Add Organization" button.
- **Button shape:** rounded rectangle, `border-radius: 10px`.
- **Button text:** white `#FFFFFF`, 13px, weight 500.
- **Padding:** `9px 16px`.

### Search bar
- **Shape:** rounded rectangle, `border-radius: 10px`.
- **Background:** `#F7F8FA`, border `1px solid #E2E5EA`.
- **Width:** 432px max (base 360px + ~10% each side), centered horizontally, pinned to top.
- **Placeholder text:** "Search", color `#A8AEBC` (icon), input text `#1F2433`.
- **Icon:** magnifier, stroke `#A8AEBC`.

### Page
- **Background:** white `#ffffff`.
- **Font:** inherited (Geist sans from layout).

### Palette reference (from dashboard mockup)
- Indigo accent: `#6366F1` / vibrant `#4F46FF`
- Text primary: `#1F2433`
- Text muted: `#8A90A0`, `#A8AEBC`
- Surface: `#F7F8FA`, borders `#E2E5EA` / `#ECEEF2`
