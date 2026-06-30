# Design Log — Internal Ops Dashboard

A running record of every visual/design decision: colors, shapes, components, type, spacing. Newest entries at the top. When something changes, log the old value → new value and why.

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
