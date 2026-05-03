# lifeOS — Enhancements & Upgrade Tracker

---

## ~~1. Month View: Click Day → Navigate to Week~~ ✅ Complete

Clicking a day cell navigates to the *week* view containing that day, keeping the clicked day highlighted. Clicking the large date number in the week column header drills into day view.

---

## ~~2. Day Page: Two-Column Layout — Time Slots + Spend Side by Side~~ ✅ Complete

Day card body split into left (~60%) for events/tasks/time grid and right (~40%) for spend — always visible, no scrolling needed. Stacks to single column on narrow screens.

---

## ~~3. Day Page: Flexible Time Blocks (Multi-Hour & Half-Hour Entries)~~ ✅ Complete

30-minute visual time grid replacing plain hour inputs. Drag to create blocks with arbitrary start/end times. Blocks store `startHour`, `startMin`, `endHour`, `endMin`, `text`. Click a block to edit or delete.

---

## ~~4. Visual Restyling — Sakura Studio Palette~~ ✅ Complete

Full CSS token swap to pastel pink / warm blush palette. Lavender (`#e8e0f5` / `#9b7ec8`) for tasks, sky blue retained for time blocks, rounder radius tokens (`--radius: 8px`, `--radius-lg: 14px`), rose→lavender gradient on splash logo, active view button uses rose accent.

---

## ~~5. Logo Click → Jump to Today~~ ✅ Complete

Clicking the "lifeOS" logo in the topbar resets cursor to today and switches to day view. `today` now uses `new Date()` (real current date) instead of a hardcoded value.

---

## ~~6. Number Formatting — Always `toLocaleString()`~~ ✅ Complete

All ¥ amounts (spend inputs, NISA projections, currency cards, totals, expression breakdown hints) use `.toLocaleString()` for comma formatting (e.g. 100000 → 100,000).

---

## ~~7. Month View — Remove Expense Summary Section~~ ✅ Complete

Removed the spend bar chart and category breakdown panel from below the monthly calendar grid. The calendar now uses the full panel space. Per-day ¥ totals inside each cell are retained.

---

## ~~8. Color System — 8 Fixed Swatches~~ ✅ Complete

Replace all free color pickers with a palette of exactly 8 colors rendered as clickable circles:
`#2d5a3d` green · `#2c4a6e` navy · `#8b2c2c` brick · `#8b5e3c` brown · `#5a3c7a` purple · `#7a6830` olive · `#3c6b6b` teal · `#888888` grey

Apply everywhere a color is chosen: add event modal, category labels, countdowns.

---

## ~~9. Spend Categories — User-Configurable~~ ✅ Complete

Each of the 8 spend categories maps to one of the 8 swatches. A Settings modal lets the user rename any category and reassign its color. Default mapping (Food=green, Transport=navy, etc.) unchanged on fresh start.

---

## 10. Day View — No-Scroll Fixed-Height Grid (Google Calendar Style)

Day view fits entirely in the visible viewport with no vertical scroll. Fixed-height proportional time bands 4am–11pm. Multiple entries in the same slot render side by side as columns.

---

## ~~11. Sidebar — Replace 4 Tabs with Notes + Upcoming + Countdowns~~ ✅ Complete

**Notes** tab — unchanged.

**Upcoming** tab — unified feed sorted soonest first:
- Countdown timers (user-defined) shown as "in X days" or "today!"
- Events from `DATA.events` within 60 days shown as "in X days — [name]"
- Goals from `DATA.goals` for future months shown as "in X months — [goal]"

**Countdowns** tab — add/edit/delete named dates. Each entry: label, date, optional yearly repeat, color. Stored in `DATA.countdowns = [{id, label, date, yearly, color}]`.

---

## ~~12. 成長投資枠 — Per-Year Lump Sum Input~~ ✅ Complete

Replace the single yearly lump sum field with a per-year table. Each row has an editable lump sum field. Stored as `DATA.nisa.lumpSumByYear = {"2026": 500000, ...}`. `nisaCalc()` reads per-year amounts. Show `+ add year` / `×` to manage rows. Cap calculation accounts for variable amounts.

---

## ~~13. Currency — Manual Rate Editing + Base Currency Toggle~~ ✅ Complete

All currency cards show the exchange rate with an editable input. Toggle at top: "base currency: JPY | IDR" — when IDR is selected all totals show in IDR. Rates stored in `DATA.currencyRates = {USD: 149.5, ...}` (JPY base = 1).

---

## ~~14. Data Persistence — Auto-Save via File System Access API~~ ✅ Complete

Remove the 💾 save button. On first start/load, prompt once with `showSaveFilePicker` (suggestedName: `lifeOS-save.json`). Store the file handle; auto-save silently after every data change (debounced 1 s). Show a subtle fading "saved" indicator in the topbar. Fall back to manual download on browsers without the API. Show a Safari-specific warning to use Chrome for auto-save.

---

## ~~15. Countdowns — Since/Until Mode + Smart Elapsed Display~~ ✅ Complete

Add a `mode` field (`'until'` | `'since'`) to each countdown entry. Data model: `{id, label, date, yearly, color, mode}`. Old entries default to `'until'`.

**Modal UI**: Two-button toggle `until | since` above the date input.

**Display logic:**
- `until` → current behavior: "in X days" / "today!"
- `since`, no yearly repeat → smart elapsed: < 60 days → "X days since" · < 24 months → "X months since" · else → "X yrs Y mo since"
- `since` + yearly → age/anniversary mode: "X years · next in Y days" (e.g. birthday: "age 30 · turning 31 in 8 days")

**Upcoming tab:** `until` entries show as now; `since` + yearly shows next anniversary "in Y days"; `since` no repeat excluded (it's a tracker, not a future event).

---

## ~~16. Countdown Modal — Contextual Hints for Type Toggle and Yearly~~ ✅ Complete

When the `until / since` toggle is switched, show a one-line hint below it:
- `until` → "counts down to this date"
- `since` → "tracks time elapsed from this date"

The "repeat yearly" label also gets a contextual sub-note that updates with the toggle:
- `until` + yearly → "(recurring event)"
- `since` + yearly → "(birthday / anniversary mode)"

Both hints update live as the toggle changes via `cdSetMode()`.

---

## ~~17. Bug Fix — Currency Section: Toggle + Amount Input~~ ✅ Complete

Two bugs in the savings view currencies section:
- Amount input called `renderSidebar()` instead of `render()`, so typing an amount never updated the equivalent display
- Equivalent line hardcoded `¥` instead of `fmtSpend()`, so the JPY/IDR toggle had no visible effect in the savings panel

Also added a **total held** row below the currency grid that updates with the base currency toggle.

---

## Status

| # | Feature | Status |
|---|---|---|
| 1 | Month View: Click Day → Navigate to Week | ✅ |
| 2 | Day Page: Two-Column Layout | ✅ |
| 3 | Day Page: Flexible Time Blocks | ✅ |
| 4 | Visual Restyling — Sakura Studio Palette | ✅ |
| 5 | Logo Click → Jump to Today | ✅ |
| 6 | Number Formatting — Always toLocaleString() | ✅ |
| 7 | Month View — Remove Expense Summary | ✅ |
| 8 | Color System — 8 Fixed Swatches | ✅ |
| 9 | Spend Categories — User-Configurable | ✅ |
| 10 | Day View — No-Scroll Fixed-Height Grid | ⏳ pending |
| 11 | Sidebar — Notes + Upcoming + Countdowns | ✅ |
| 12 | 成長投資枠 — Per-Year Lump Sum | ✅ |
| 13 | Currency — Rate Editing + Base Toggle | ✅ |
| 14 | Auto-Save via File System Access API | ✅ |
| 15 | Countdowns — Since/Until + Smart Elapsed | ✅ |
| 16 | Countdown Modal — Contextual Hints | ✅ |
| 17 | Bug Fix — Currency Toggle + Amount Input | ✅ |

**Only #10 remains.** It is the largest rewrite — fixed-height viewport grid with overlap column layout.
