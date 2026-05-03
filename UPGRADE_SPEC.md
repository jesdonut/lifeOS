# lifeOS — Upgrade Specification
> Hand this file to Claude along with index.html and say: "implement all upgrades in UPGRADE_SPEC.md"

---

## 1. Color System — 8 fixed colors only
- Replace all free color pickers with a palette of exactly 8 colors:
  `#2d5a3d` (forest green), `#2c4a6e` (navy), `#8b2c2c` (brick red),
  `#8b5e3c` (brown), `#5a3c7a` (purple), `#7a6830` (olive),
  `#3c6b6b` (teal), `#888888` (grey)
- Render as clickable color swatches (small circles), not a color input
- Apply everywhere: add event modal, category labels, any place color is chosen

## 2. Spend Categories — color-based, user-configurable
- Each of the 8 spend categories maps to one of the 8 colors
- In a Settings panel (or modal), user can rename any category and reassign its color swatch
- Default mapping stays as-is (Food=green, Transport=navy, etc.)

## 3. Day View — no scrolling, supports overlapping
- The day view must fit entirely in the visible viewport with no vertical scroll
- Use a fixed-height time grid (like Google Calendar style)
- Time slots should be proportional bands, not a stacked list
- Allow multiple entries in the same time slot (overlapping events shown side by side as columns)
- Hours run 4am–11pm

## 4. Month View — remove expense tracker section
- Remove the spend bar chart and category breakdown from the month view entirely
- The monthly calendar grid should use the full panel space
- Keep spend totals visible per day cell (the small ¥ number), just remove the summary section below

## 5. Sidebar — replace 4 tabs with smart upcoming panel
Replace current tabs (notes, events, spend, FX) with:
- **Notes** tab — same as before
- **Upcoming** tab — single unified feed showing:
  - Countdown timers: user-defined dates with labels (e.g. "Birthday", "Anniversary")
    shown as "in X days" or "today!" — these are permanent recurring or one-off countdowns
  - Upcoming events (from DATA.events) within the next 60 days, shown as "in X days — [event name]"
  - Upcoming goals (from DATA.goals) — any goal text associated with a future month, shown as "in X months — [goal]"
  - All sorted by soonest first
- **Countdowns** tab — manage the countdown list: add/edit/delete named dates
  - Each countdown: label, date, optional repeat (yearly for birthdays/anniversaries)
  - Stored in DATA.countdowns = [{id, label, date, yearly, color}]

## 6. 成長投資枠 — per-year lump sum input
- Remove the single "yearly lump sum" field
- Replace with a per-year table: user sets a custom lump sum amount for each year
- Stored as DATA.nisa.lumpSumByYear = {"2026": 500000, "2027": 200000, ...}
- In the savings view, show a table where each row = one year, with an editable lump sum field
- The nisaCalc() function must read lumpSumByYear[year] for each year instead of a fixed value
- Show "+ add year" to add a new row, and × to remove a row
- The cap milestone calculation must account for variable per-year amounts

## 7. Currency — manual rate editing, base currency toggle
- All currency cards should show the exchange rate used, with an editable input for that rate
- Add a toggle at the top: "base currency: JPY | IDR" — when IDR is selected, all totals shown in IDR
- The IDR↔JPY conversion should use the user-editable rate
- Store custom rates in DATA.currencyRates = {USD: 149.5, GBP: 189.2, ...} (JPY as base=1)

## 8. Logo click → jump to today
- Clicking the "lifeOS" logo in the topbar calls: cursor = new Date(today); setView('day');
- today is already defined as: const today = new Date(2026, 4, 2);
- Note: today should actually use the real current date: new Date() — not hardcoded

## 9. "contrib" → "contribution" (full word)
- Find and replace all instances of "contrib" label text with "contribution"
- Applies in savings view NISA projection cards

## 10. Number formatting — always use toLocaleString()
- All ¥ amounts displayed anywhere must use .toLocaleString() for comma formatting
- e.g. 100000 → 100,000 — check spend inputs, NISA projections, currency cards, totals

## 11. Data persistence — auto-save to file in /data folder (no download button)
- Remove the 💾 save button from the topbar
- Instead: auto-save silently using the File System Access API (window.showSaveFilePicker)
  - On first "start fresh" or after load: prompt user once to pick a save location using showSaveFilePicker
    with suggestedName: "lifeOS-save.json" pointing to the data/ subfolder
  - Store the FileSystemFileHandle in a variable (not in DATA)
  - After every data change (debounced 1 second), write DATA as JSON to that file handle silently
  - Show a subtle "saved" indicator (small text, fades after 1.5s) in the topbar instead of a button
- If File System Access API is not available (older browser), fall back to the download approach with a warning
- On load: use showOpenFilePicker to let user pick their save file, same as before
- The splash screen should say "pick your save file" instead of "load save file"
- NOTE: File System Access API works in Chrome/Edge on desktop. Safari does NOT support it yet.
  Show a browser warning if on Safari: "For auto-save, use Chrome. Safari requires manual save."

## Implementation notes
- Keep all existing functionality that is not mentioned here
- DATA structure additions needed:
  - DATA.countdowns = []  (countdown items)
  - DATA.nisa.lumpSumByYear = {}  (replaces lumpSumYearly)
  - DATA.currencyRates = {JPY:1, IDR:0.0093, USD:149.5, ...}  (user-editable)
  - DATA.baseCurrency = 'JPY'  (or 'IDR')
- Remove from DATA: DATA.nisa.lumpSumYearly (replaced by lumpSumByYear)
- Keep: DATA.events, DATA.tasks, DATA.slots, DATA.spend, DATA.goals, DATA.notes, DATA.catLabels, DATA.nisa.tsumitateMonthly, DATA.nisa.startYear, DATA.nisa.projectionYears, DATA.currencies
