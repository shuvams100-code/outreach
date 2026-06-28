# Design Log — Internal Ops Dashboard

A running record of every visual/design decision: colors, shapes, components, type, spacing. Newest entries at the top. When something changes, log the old value → new value and why.

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
