# lifeOS — Enhancements & Upgrade Tracker

## Codex Audit — Unfinished Items (this is written by codex)

User feedback recorded:
- #10 is cancelled
- #21 is cancelled
- #24 is fixed
- #25 is fixed
- #26 is cancelled
- #27 is done
- #28 is done
- #29 is done
- #30 is done, likely
- #50 is done
- #51 is done
- #52 is done

Codex checklist after checking `app.js` and `mobile-app.js`:

| # | Item | Codex status | Evidence |
|---|---|---|---|
| 53 | Clean Defaults — Zero NISA Values + No Bank Account Presets on Start Fresh | Complete | Desktop and mobile now keep all save-file fields but use neutral defaults: `tsumitateMonthly:0`, empty `projectionYears`, and empty `bankAccounts`. Loading older saves still preserves existing NISA years and bank account data. |
| 54 | Currencies — Remove IDR, KRW, EUR from Display Cards | Complete | Desktop now renders only CNY, GBP, USD, and MYR cards. IDR remains in `CURRENCIES` with `hidden:true` so IDR rate lookups for lots/bonds keep working. KRW/EUR saved data is preserved in `DATA` but no longer has display cards. Mobile has no currency display card grid. |
| 55 | NISA — Compact Config + Scrollable Snapshot Table | Complete | Desktop NISA config now uses `nisa-config-row` with meta controls on the left and a scrollable `nisa-snaps-scroll` snapshot table on the right. The initial desktop `DATA` uses 3 suggested snapshot years, while `startFresh()` stays clean from #53. Mobile has no matching NISA config UI. |

Everything below this audit is the historical tracker/spec text (this is written by claude code).

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
- `since`, no yearly repeat → smart elapsed: < 60 days → "X days since" · < 24 months → "X months since" · else → "X years Y mo since"
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

## ~~18. Bug Fix — NISA Lifetime Cap Description~~ ✅ Complete

The info text in the savings view says "つみたて max ¥12M + 成長 max ¥12M (shared ¥18M pool)" which is wrong. Correct rules:
- つみたて投資枠: ¥1.2M/year max
- 成長投資枠: ¥2.4M/year max
- Combined lifetime cap: ¥18M (shared pool)
- Max annual contribution: ¥3.6M/year if both are used

The calculation logic already enforces the correct caps (¥1.2M and ¥2.4M per year). Only the description text needs fixing. One-line change in `renderSavings()`.

---

## ~~19. Year View — Clearer Goal Row Labels and Icons~~ ✅ Complete

Current icons and labels in the year view monthly blocks:
- `→` + placeholder `goal...`
- `◎` + placeholder `milestone...`
- `·` + placeholder `note...`

These feel abstract. Replace with icons and wording that better reflect life planning:
- Row 0: `★` + placeholder `aim...` — the big thing you want to achieve this month/year
- Row 1: `▶` + placeholder `by this point...` — a specific milestone or checkpoint to hit
- Row 2: `—` + placeholder `note...` — free text, observations, reminders

Small change — a few string replacements inside `renderYear()`.

---

## ~~20. Currency Cards — Rate Label Respects Base Currency~~ ✅ Complete

Each currency card shows `1[CODE] = [rate] ¥`. The `¥` is hardcoded — when IDR is the base currency the label still says ¥ instead of Rp.

Fix: when `DATA.baseCurrency === 'IDR'`, convert the displayed rate from JPY to IDR and show `Rp` instead of `¥`. The stored rate stays in JPY terms internally; only the display label changes.

Small change — update the rate label span in `renderSavings()` currency card loop.

---

## 21. Day View — Condensed Time Grid (Reduce Scrolling)

The day view currently shows 4am–11pm (20 hours). On a 13" MacBook Pro screen the full grid requires significant scrolling.

Two-part fix:
1. Narrow the default time range to **7am–10pm** (15 hours instead of 20) — blocks outside this range are still preserved, just not shown unless they exist.
2. Reduce per-slot row height slightly in CSS so the visible range fits within a normal viewport.

Medium complexity — involves changing the `HOURS`/`HLABELS` constants or adding a render-time filter, plus CSS row height tuning.

---

## ~~22. Currency — Purchase Lots & P&L Tracking~~ ✅ Complete

Track what you paid when you bought each foreign currency so you can see your gain/loss at current rates.

**Data model** — new array `DATA.currencyLots`:
```
{ id, code, amount, rateIDR, date }
```
- `code` — "USD", "CNY", etc.
- `amount` — how many units of foreign currency you bought
- `rateIDR` — IDR per unit at time of purchase (e.g. 17000 for 1 USD = Rp 17,000)
- `date` — purchase date "YYYY-MM-DD"

**Display** — inside each currency card, below the amount input:
- Collapsible "lots" section listing each purchase row: date · amount · bought at Rp X · now Rp Y · P&L Rp ±Z
- "+ add lot" button opens a small modal (date, amount, rate paid)
- Summary line per currency: total cost basis vs current value, overall % gain/loss
- Current IDR rate derived from stored JPY rates: `getRate(code) / getRate('IDR')`

**Scope** — medium. New modal, new lot rows per card, P&L math. No graph yet (historical snapshots would need separate infrastructure).

---

## ~~23. Government Bonds Tracker (Active + Matured)~~ ✅ Complete

Track Indonesian government retail bonds of any type (ORI, SR, ST, SBR) — monthly coupon income, maturity countdowns, and a full archive of past bonds.

**Example fields (generic):**
| Field | Example |
|---|---|
| Series | ST00X |
| Face value | Rp 00,000,000 |
| Coupon rate | 7.00% |
| Tax (Pajak) | 10% |
| First coupon | YYYY-MM-DD |
| Maturity | YYYY-MM-DD |
| Duration | X months |
| Net monthly coupon | derived |
| Total coupons earned | derived |

**Data model** — new array `DATA.bonds`:
```
{ id, series, faceValue, couponRate, taxRate, settlementDate, firstCouponDate, maturityDate, matured }
```
- `series` — "ST005", "ORI024", "SR020", etc.
- `faceValue` — IDR principal (e.g. 100000000)
- `couponRate` — annual gross rate as decimal (e.g. 0.074 for 7.40%)
- `taxRate` — withholding tax as decimal (e.g. 0.10 for 10%) — varies per bond
- `settlementDate` — actual purchase/settlement date "YYYY-MM-DD"
- `firstCouponDate` — date of first coupon payment (usually 1 month after settlement)
- `maturityDate` — when principal is returned "YYYY-MM-DD"
- `matured` — boolean

**Derived calculations (all from stored fields):**
- Gross monthly coupon = `faceValue × couponRate / 12`
- Net monthly coupon = gross × `(1 − taxRate)`
- Annual net = net monthly × 12
- Duration months = months from firstCouponDate to maturityDate (inclusive)
- Total net coupons = net monthly × duration months
- Coupons received so far = net monthly × months elapsed since firstCouponDate
- Remaining = total − received

**Display** — new "government bonds" section in the Savings view below Currencies:
- Active bonds: card per bond — series, face value, coupon %, net monthly income, countdown to maturity, coupons received vs total
- Summary line: total net monthly income across all active bonds
- Matured archive: collapsed section showing each matured bond and total earned
- "+ add bond" modal: series, face value, coupon %, tax %, settlement date, first coupon date, maturity date
- Maturity dates feed the **upcoming** sidebar tab as reminders

**Scope** — medium-high. New section + modal, month-diff math, archive toggle, upcoming integration.

---

## 24. Bug Fix — Currency Lots: rateIDR Is Total Cost, Not Per-Unit Rate

`rateIDR` stored per lot represents the **total IDR spent** for that purchase, not the price per unit. Current calculations treat it as per-unit and multiply by `amount`, causing massively inflated cost basis and P&L figures.

**Fixes required (all in the currencyLots render block ~line 753–771):**

1. `totalCost` — remove the `l.amount *` multiplier:
   ```js
   // was: s + l.amount * l.rateIDR
   s + l.rateIDR
   ```
2. Per-lot P&L — derive cost-per-unit first:
   ```js
   // was: l.amount * currentIDR - l.amount * l.rateIDR
   var costPerUnit = l.rateIDR / l.amount;
   var pl = Math.round((currentIDR - costPerUnit) * l.amount);
   ```
3. Display rate — show derived per-unit price, not raw total:
   ```js
   // was: Math.round(l.rateIDR).toLocaleString()
   Math.round(l.rateIDR / l.amount).toLocaleString()
   ```
4. Modal label (line 1225) — change `"rate paid (IDR per 1 CODE)"` → `"total IDR spent"` to match actual semantic.

No data migration needed — existing saved lots already store totals.

---

## 25. NISA つみたて — Per-Year Monthly Amount

The tsumitate monthly contribution (`DATA.nisa.tsumitateMonthly`) is a single value for all years. As the amount may change year to year (e.g. ¥60,000/mo in 2026, ¥80,000/mo from 2027 onward), it should be configurable per year.

**Data model change:**
```js
// Replace single field:
nisa.tsumitateMonthly: 60000

// With per-year map (same pattern as lumpSumByYear):
nisa.tsumitateByYear: { "2026": 60000, "2027": 80000 }
```
- Default: if a year has no entry, fall back to the previous year's value (or a hardcoded default of ¥60,000)
- Migration: on load, if `tsumitateMonthly` exists but `tsumitateByYear` doesn't, seed `tsumitateByYear` with `{ [startYear]: tsumitateMonthly }`

**UI** — same pattern as 成長投資枠 per-year lump sum (#12): a small table in the NISA section with one row per configured year (editable monthly amount) + `+ add year` / `×` controls.

**Calc change** — `nisaCalc()` reads `tsumitateByYear[year] * 12` for the annual tsumitate contribution in each projection year instead of the single monthly value.

**Also added** — `startMonth` field (1–12, default Jan). The start year's contribution is calculated as `monthly × (13 − startMonth)` so a May start correctly contributes 8 months instead of 12. Start month is a dropdown in the NISA UI next to start year.

**Scope** — small-medium. Mirrors existing lumpSumByYear pattern closely.

---

## 26. Bank Account Totals Tracker

Track cash balances across bank accounts. Initial accounts: **BCA** (IDR) and **MUFG** (JPY). Display as part of the Savings view, showing each balance converted to the active base currency.

**Data model** — new array `DATA.bankAccounts`:
```js
{ id, name, currency, balance }
// e.g. { id, name: "BCA", currency: "IDR", balance: 5000000 }
//      { id, name: "MUFG", currency: "JPY", balance: 0 }
```

**Display** — new "bank accounts" section in the Savings view (above or below currencies):
- One row per account: name · balance (native currency) · balance (base currency equivalent)
- Editable balance field inline
- Total row: all balances summed in base currency
- `+ add account` for future accounts (optional for now)

**Scope** — small. Simple editable list with currency conversion using existing `getRate()` / `fmtSpend()` helpers.

---

## 27. Daily Finance Tracker — Income, Bills, Spending

Import and visualize the monthly financial data currently tracked in Excel. This is a significant feature that may warrant splitting `app.js` into multiple files (e.g. `app-core.js`, `app-finance.js`).

**Data model** — new `DATA.finance` keyed by `"YYYY-MM"`:
```js
DATA.finance["2025-01"] = {
  // Income
  salary: 0,          // 給料
  transportReimb: 0,  // Transport reimbursement
  taxWithheld: 0,     // 税金 (as negative or tracked separately)
  insuranceDed: 0,    // 保険料 deducted at source
  otherIncome: 0,     // 所得
  momPays: 0,         // Mom Pays (flights, hotel, etc.)

  // Bills (fixed monthly)
  rent: 0,            // 家賃
  gas: 0,             // ガス費
  water: 0,           // 水道費
  electricity: 0,     // 電気料金
  phone: 0,           // 携帯
  internet: 0,        // インターネット

  // Necessities
  paperwork: 0,       // 書類仕事
  medical: 0,         // メディカル
  necessities: 0,     // 日常生活
  nhi: 0,             // 国民保険 (NHI)

  // Optional spending
  food: 0,            // 食べ物
  transport: 0,       // 電車代金 (non-commute)
  project: 0,         // ゲーム / Project
  fun: 0,             // エンターテイメント
  clothes: 0,         // 服・髪

  // Transport pass (separate from daily transport)
  commutationPass: 0, // 通勤定期券
}
```

**Derived totals per month:**
- Total Income = salary + transportReimb + otherIncome + momPays − taxWithheld − insuranceDed
- Clean Salary = salary − taxWithheld − insuranceDed
- Total Bills = rent + gas + water + electricity + phone + internet
- Total Necessities = paperwork + medical + necessities + nhi
- Total Optional = food + transport + project + fun + clothes
- Balance Remaining = Total Income − commutationPass − Total Bills − Total Necessities − Total Optional

**Display** — new "Finance" view (tab in the main nav, or sub-section of an existing view):
- Month selector
- Collapsible sections per group (Income, Bills, Necessities, Optional)
- Each field: label (Japanese + English) · editable input · currency symbol
- Summary table at bottom: group totals + Balance Remaining
- Trend view (future): sparklines or table of monthly balances over time

**File split recommendation** — when this is implemented, split `app.js` into:
- `app-core.js` — DATA model, save/load, render dispatch, navigation, utilities
- `app-calendar.js` — day/week/month/year view rendering and event logic
- `app-finance.js` — savings (NISA, currency, bonds, banks) + new finance tracker

**Scope** — large. New view, large data model, grouped inputs, derived totals. No graphs in first pass.

**Note** — this feature is now shaped by #28 (weekly replaces daily). Finance tracking per month should align with weekly aggregation from #28 rather than per-day inputs.

---

## 28. Remove Day View — Weekly Becomes Primary Calendar + Finance View

The day view is retired. Week becomes the finest granularity of the calendar. The week view gains finance tracking (budget, spending, income) in place of the current day-level spend panel.

**Nav change:** `day | week | month | year | years | savings` → `week | month | year | savings`

**What happens to existing day view data:**
- Time blocks (`DATA.slots`) keyed by date — still stored, rendered inline on the week view per day column (compact, no drag-to-create; click to view/delete)
- Per-day spend (`DATA.spend`) — stays keyed by date, aggregated to weekly totals on the week view
- Day view functions (`renderDay`, `jumpDay`, the `setView('day')` path) — removed

**Week view additions:**
- Weekly budget target field (editable, stored in `DATA.weeklyBudget` or per-week key)
- Weekly income total (sum from the Finance tracker, #27/#29, or manual entry)
- Weekly spend total (sum of per-day spend entries for that week)
- Weekly balance = income − spend
- Spend breakdown by category for the week (same 8-category system)
- Each day column retains: event list, task list, compact time block display, spend entries

**Scope** — medium-large. Removes one view entirely, restructures week render, adds weekly finance summary panel. Coordinates with #27 for monthly rollup.

---

## 29. Merge Year + Years Views → Single "Year" View with Calendar

Currently: `year` shows monthly goal/milestone/note rows for one year; `years` (multiyear) shows a 5-year grid. These serve overlapping purposes and split navigation unnecessarily.

**New unified "year" view** (replaces both `year` and `multiyear`, nav button stays `year`):

Three sections stacked vertically within the same panel:

1. **Annual calendar grid** — 12 month thumbnails in a 4×3 or 6×2 grid. Each cell shows the month name and clickable days (or just the month name as a button to `jumpMonth()`). Gives a full-year at-a-glance calendar feel.

2. **Monthly goal rows** — existing year view content: each of the 12 months with ★ aim / ▶ by this point / — note rows. Kept exactly as-is.

3. **Multi-year strip** — a condensed version of the current multiyear 5-year grid below, for broader context. Navigation arrows change which year is focused.

**Nav change:** `years` button removed from nav. `year` button handles both.

**Data** — `DATA.goals` (keyed `YYYY-M`) and `DATA.multiYearGoals` (if any) remain unchanged. No migration needed.

**Scope** — medium. Remove one view, restructure `renderYear()` to include the calendar grid and optional multi-year strip. Most logic already exists.

---

## 30. Bug Fix — Years View: Day Badges + Equal Column Widths

Two issues in the multiyear (`years`) view:

1. **Events showed text only** — date information was lost when building the items list. Fixed by preserving `{day, text}` objects through the pipeline; events and tasks render a small square badge (e.g. `20`) before the text using the day extracted from the `YYYY-MM-DD` key. Goals (no specific day) get no badge.

2. **Month columns were unequal width** — CSS grid `repeat(12, 1fr)` cells expand to fit content by default (`min-width: auto`). Long event names pushed some columns wider. Fixed by adding `min-width: 0` to `.my-month-cell` and `.my-month-content`, and switching `.my-month-item` to `display:flex` so text truncates via `text-overflow:ellipsis` within its constrained column.

---

## ~~31. NISA Tracker UI Redesign~~ ✅ Complete

Redesigned the NISA section in the savings view to be cleaner and more information-dense.

**Implemented:**
- Hero strip: 4 stats — lifetime plan total + stacked progress bar (つみたて pink / 成長 navy), cap year, this year total, avg/year
- Two-panel side-by-side budget editor: つみたて (pink) | 成長 (navy)
- 成長 panel collapses empty ¥0 years with expand/collapse toggle
- Compact meta strip: start year, start month, this year monthly
- Snapshot table with rows + mini progress bars (uses existing `projectionYears` list)
- No new color tokens — `var(--accent)` for pink, `#2c4a6e` for navy

---

## ~~32. Year View Redesign — Timeline, Decade Strip, Category Colors~~ ✅ Complete

Refactor the year view to match the Claude-designed mockup. Keep existing data model, routing, and JP labels. Only change layout and styling.

**Required changes (in order):**

1. **Decade nav strip** — 11 mini-cards above the year list: year + age + 5-segment activity sparkline (dots per category). Click to jump to that year. Current year highlighted.
2. **Year card 3-column header** — left: year number + age chip + category counts (work · life · learn · travel); center: one-line editable summary; right: NISA inline meter (cumulative bar toward ¥18M, cumulative value, % of cap, delta this year).
3. **Continuous timeline** — 12-column CSS grid with month labels above; events positioned with `grid-column: <start> / span <n>`. Multiple parallel tracks so events don't overlap. Faint per-month gridlines behind tracks via `::before`.
4. **Event category colors** — work (pink `#c8456c`), life (blue `#5a8fc8`), learn (orange `#c87a3a`), travel (green `#4a8a5a`). Each event = colored chip with leading dot + label, `text-overflow: ellipsis`, `title` attr for full text on hover.
5. **Aims / Checkpoint / Note footer** — 3-column strip per year card, separated from timeline by a dashed border. Inline-editable (click to type).
6. **Collapsed empty years** — year with 0–1 events renders as a single-line card: `year | age chip | one-line meta (N events · NISA ¥X · goal text) | expand →`. Click to expand.
7. **Planner grid only for focused year** — the existing 12-month mini-calendar grid only shows for the focused/expanded year, and only renders months that have at least one event.
8. **New color tokens** — `--tsumitate: #e85a8a`, `--growth: #5a8fc8`, `--c-work: #c8456c`, `--c-life: #5a8fc8`, `--c-learn: #c87a3a`, `--c-travel: #4a8a5a`. `--accent` updates to `#c8456c` (matches mockup's rose).

**Data shape notes:**
- Events already stored as `DATA.events["YYYY-MM-DD"]: [{text, color}]` — use existing color to infer category (map hex → category key).
- Goals already stored as `DATA.goals["YYYY-MM-N"]` — use for aims/checkpoint/note (Q1→aim, Q2→checkpoint, Q3→note, or keep existing structure).
- No new data fields required; category assignment is a display-layer concern based on event color.

**Scope** — large. Touches `renderYear`, `renderMultiYear` (already deleted), CSS tokens, and adds new CSS classes. Computation logic (NISA, events) unchanged.

---

## ~~33. Spend Panel — Always Visible, Week Grid Compact~~ ✅ Complete

The spend panel was hidden by default (collapsed behind a toggle button) and, once opened, had internal scrolling because all 9 category rows didn't fit.

**Changes:**
- `_spendOpen` initialised to `true` so the panel is open on every load — no toggle needed
- `.week-grid` changed from `flex:1` (fills all space) to `flex:0 0 220px` (fixed compact height), giving spend the remaining room
- `.wk-spend-panel` max-height and overflow-y removed — all 9 rows are visible at once, no internal scroll

---

## ~~34. Finance View Redesign — Hero Strip, Accordions, Sticky Compare~~ ✅ Complete

Replaced the flat single-column finance layout with a more information-dense design.

**Hero strip (3-column grid):**
- Left: large balance + MoM delta (green if up, red if down)
- Center: 6-month sparkline (income line in green, balance fill in soft green/red)
- Right: income proportion bar — colored segments showing what share of income goes to each category

**Two-column body:**
- Left (1.4fr): accordion stack — Income, Fixed Monthly, Food, Transport, Necessities, Optional
- Right (1fr): sticky 3-month compare panel (current + 2 prior months), balance row, YTD avg and annual pace

**Accordion details:**
- Chevron rotates on open; Income opens by default, others collapsed
- Header: chevron · JP/EN title · meta ("N of M filled" for manual sections, "auto · from daily" pill for auto sections) · section total
- Filled fields get accent border + pink background
- Auto rows render as dashed chips with an "auto" badge — not editable inputs

**New CSS tokens:** `--good`, `--good-soft`, `--bad`, `--bad-soft`, `--c-income`, `--c-fixed`, `--c-food`, `--c-transport`, `--c-necessities`, `--c-optional`

---

## ~~35. Bug Fix — Daily Spend Always Shown in ¥~~ ✅ Complete

`fmtSpend()` was converting yen spend values to IDR when `DATA.baseCurrency === 'IDR'`, so the week/month/year spend display showed "Rp" amounts even though all daily expenses are entered in JPY.

**Fix:** split into two functions:
- `fmtSpend(jpyVal)` — always returns `¥` format; used everywhere daily spend is displayed
- `fmtBase(jpyVal)` — respects base currency toggle; used only in Savings view (currency card equivalents, bank account totals, currency total held)

---

## ~~36. Finance — Formula Input in All Fields~~ ✅ Complete

All manual finance fields (income, fixed monthly) and the weekly spend panel now accept arithmetic expressions. Typing `50000*2` or `1200+800` evaluates on blur and saves the result. Implemented by routing all inputs through the existing `parseExpr()` helper. Spend inputs changed from `type="number"` to `type="text"` (with `inputmode="decimal"`) so browsers don't block non-numeric characters.

---

## ~~37. Finance — Per-Month Breakdown Panel + Cumulative Net~~ ✅ Complete

Replaced the 3-month comparison panel (right column of finance view) with a per-month breakdown showing Income, Fixed, Food, Transport, Necessities, Optional, and Net for the current month. A "Total since Jan 2025" line at the bottom sums all monthly balances from Jan 2025 to the current month, giving a running lifetime net.

---

## ~~38. Currencies — Dual Independent JPY + IDR Rates~~ ✅ Complete

Replaced the JPY/IDR base currency toggle with dual independent rate fields per currency card. Each card now shows two editable rate inputs: `1 CODE = X ¥` and `1 CODE = Y Rp`. Changing one does not affect the other.

**Data model change:** `currencyRates` entries upgraded from a single number to `{ jpy: number, idr: number }`. Old single-number saves load correctly (JPY rate preserved, IDR derived on first encounter).

All totals (currency "total held", bank accounts) now show both ¥ and Rp simultaneously. The JPY/IDR toggle button is removed entirely.

---

## ~~39. Week View — Spend Panel Always Visible, Toggle Removed~~ ✅ Complete

Removed the "▾ log spending / ▴ hide spending" toggle button from the week view. The spend panel is now permanently visible. The `_spendOpen` flag and `toggleSpend()` function are deleted.

---

## ~~40. Finance — Commute Category + Section Restructure~~ ✅ Complete

Added `commute` (通勤費) as a new spend category distinct from `transport` (電車代金). Work commute (reimbursable) and personal transport are now tracked separately.

**Spend categories:**
- `commute` (通勤費) — daily commute to work; maps to the Commute Finance section
- `transport` (電車代金) — personal/leisure transport; now maps to the Necessities Finance group
- `necessities` (日常生活) en label changed to "Daily" to distinguish from the Finance section header "Necessities"
- `project` (ゲーム/P) en label: "Project/Game"; `fun` jp updated to full katakana エンターテインメント

**Finance section order:** Income → Commute → Food → Fixed Monthly → Necessities → Optional

**Commute section** (new, hybrid manual + auto): combines 通勤定期券 commutation pass (manual input) and 通勤費 daily commute spend (auto). Commutation pass removed from Fixed Monthly.

**Fixed Monthly** now contains only bills: rent, gas, water, electricity, phone, internet (6 fields).

**Necessities** now includes 電車代金 (personal transport) alongside paperwork, medical, daily, NHI.

**Income deductions — insurance split (May 2025+):** From May 2025 onwards, the single `insuranceDed` field is replaced by 7 separate deduction fields: health insurance, care insurance, child-rearing support, welfare pension, employment insurance, income tax, resident tax. Pre-May 2025 months continue to use `taxWithheld` + `insuranceDed`. Backward compatible: if new fields are empty, old values are used.

**Balance formula:** Income − Commute − Food − Fixed − Necessities − Optional

**Proportion bar:** Commute segment replaces the old Transport segment.

---

## ~~41. Week View — Event Column Height + Spend Panel Spacing~~ ✅ Complete

Reduced event column height from 400px to 200px so the spend panel fits within the viewport without scrolling. Added `margin-bottom: 10px` to event columns and increased spend row padding (`6px/7px` from `3px/4px`) to give breathing room between the event cards and the spend panel table.

---

## ~~42. Events — Editable (text, date, colour)~~ ✅ Complete

Clicking any event pill in the week or month view opens an edit modal pre-filled with the event's current name, date, and colour. Saving updates in place; changing the date moves the event to the new date. A delete button is also available inside the modal. The × on the pill still deletes directly without opening the modal.

---

## ~~43. Events — Labelled Colour Palette + Consistent Colours Across Views~~ ✅ Complete

Replaced the 8 anonymous colour swatches with 9 named category colours:

| Label | Hex |
|---|---|
| education | `#8FAFA2` |
| family | `#86AFC5` |
| friends | `#7C9CCB` |
| health | `#C79A9A` |
| partner | `#B7A6B5` |
| personal | `#D69AA5` |
| project | `#C49A73` |
| travel | `#D1B36A` |
| work | `#B8C89A` |

Swatches now render as labelled pills (dot + name) instead of plain circles. All three views (week, month, year) now use the same colour treatment: `background: color+'18'` tint with `color` text, matching the existing month view style. The year timeline chips no longer depend on category CSS classes.

---

## ~~49. Font Scale — CSS Custom Properties + Larger Base Size~~ ✅ Complete

Introduce three font-size custom properties on `:root` and apply them throughout `styles.css` and inline styles in `app.js`.

**CSS variables (add to `:root` in `styles.css`):**
```css
--fs-base: 15px;   /* body text, tasks, notes, event labels */
--fs-sm:   13px;   /* secondary labels, inputs, sidebar items */
--fs-xs:   11px;   /* tertiary metadata, tiny tags, timestamps — absolute floor */
```

**Steps:**
1. Add `--fs-base`, `--fs-sm`, `--fs-xs` to `:root` in `styles.css`
2. Replace all hardcoded `font-size` values in `styles.css` with the appropriate variable
3. Replace inline `font-size:NNpx` occurrences in `app.js` with `font-size:var(--fs-xs/sm/base)` using the same mapping
4. Verify no font size below 11px remains anywhere

**Mapping guide:**
- 10px, 11px → `var(--fs-xs)`
- 12px, 13px → `var(--fs-sm)`
- 14px, 15px, 16px → `var(--fs-base)`

**Scope** — small. CSS + grep-replace pass in app.js. No logic changes.

---

## 50. Sidebar — Collapsible Toggle

Add a collapse button to the sidebar. When collapsed, the sidebar hides and the main content expands to fill the space. Preference saved to `localStorage` so it persists across sessions.

**Steps:**
1. Add a toggle button `‹` / `›` at the top of the sidebar panel in `index.html`
2. Add `.sidebar-collapsed` class to `styles.css`: sidebar width → 0, overflow hidden, transition for slide
3. On toggle click: add/remove `.sidebar-collapsed` on `#sidebar`, save state to `localStorage('sidebar-collapsed')`
4. On page load: read `localStorage('sidebar-collapsed')` and apply class immediately (no flash)

**Scope** — small. ~20 lines JS, ~10 lines CSS, minor HTML change.

---

## 51. Settings Panel — Font Size Slider + Sidebar Default

A lightweight settings modal accessible from the topbar. Two controls only:

1. **Font size slider** — range input from 12px to 18px (step 1). Changes `--fs-base` on `:root` live; `--fs-sm` and `--fs-xs` derive from base (base−2, base−4). Saved to `localStorage('fs-base')` and applied on load.
2. **Sidebar default** — toggle: open by default / closed by default. Sets the `localStorage('sidebar-collapsed')` default used on first visit.

**Steps:**
1. Add `settings` button to topbar in `index.html`
2. Add `openSettingsModal()` to `app.js` using existing `openModal()` infrastructure
3. Slider `oninput` handler updates `document.documentElement.style.setProperty('--fs-base', val+'px')` and the derived sm/xs values, saves to localStorage
4. On page load: read `localStorage('fs-base')` and apply before first render (no layout flash)

**Prerequisite:** #49 must be complete (CSS variables must exist for the slider to work).

**Scope** — small. ~30 lines JS, minor HTML change.

---

## 52. Code Cleanup — Remove Dead CSS and Unused JS

Audit all five files for code that is no longer referenced after previous enhancements. Do NOT remove DATA model fields (bankAccounts, baseCurrency, etc.) — mobile and desktop share the same save file format, so all fields must be preserved even if not displayed everywhere.

**Known candidates from prior enhancements:**

`styles.css`:
- Day view CSS (removed in #28): `.day-wrap`, `.day-card`, `.day-body`, `.day-slots-col`, `.day-spend-col`, `.day-spend-title`, `.day-hdr`, `.day-num-big`, `.day-info`, `.day-dow`, `.day-full`, `.today-badge`, `.tg-block`
- Time slot input styles (day view): `.time-slot`, `.ts-label`, `.ts-input`
- Spend summary bar chart (removed in #7): `.spend-summary`, `.ss-title`, `.bar-chart`, `.bar-col`, `.bar-fill`, `.bar-lbl`, `.bar-val`
- Week spend toggle (removed in #39): `.wk-spend-toggle`, `.wk-spend-btn`
- Bank account section styles if any existed (removed in #44)

`app.js`:
- `fmtBase()` — added in #35 for IDR base toggle; toggle removed in #38; check if still called anywhere
- Any remaining day view render functions if not fully cleaned up in #28
- `bankAccounts` default in DATA reset — keep for save compatibility

`index.html` / `mobile.html` / `mobile-app.js`:
- Cross-check any IDs or classes that no longer exist in the JS/CSS

**Steps:**
1. Grep each candidate class/function against all files to confirm zero references
2. Remove confirmed dead code only — no speculative cleanup
3. Run a final grep pass to confirm nothing was missed

**Scope** — small-medium. Pure deletion, no logic changes. Safe as long as each removal is confirmed zero-reference.

---

## ~~53. Clean Defaults — Zero NISA Values + No Bank Account Presets on Start Fresh~~ ✅ Complete

When a user starts fresh, the DATA object should have neutral/zero values with no pre-filled entries.

**Changes to `DATA` initial declaration (line 76) and `startFresh()` (line 1680):**
- `nisa.tsumitateMonthly`: `60000` → `0`
- `nisa.projectionYears`: long array of 11 years → `[]` (empty; user adds as needed)
- `bankAccounts`: `[{BCA...},{MUFG...}]` → `[]` (empty array; #44 removed the UI, now remove the presets)

**Scope** — tiny. Two identical DATA literals in app.js, change 3 values each.

Implemented (codex wrote this):
- Desktop `DATA` defaults and `startFresh()` now use `tsumitateMonthly:0`, `projectionYears:[]`, and `bankAccounts:[]`.
- Desktop migration keeps the `bankAccounts` field for compatibility, but no longer inserts BCA/MUFG presets when the field is missing.
- Mobile defaults now use `tsumitateMonthly:0`; mobile `startFresh()` also resets in-memory `DATA` to the clean default object after clearing localStorage.
- Existing uploaded saves still preserve their saved `nisa`, `projectionYears`, `tsumitateByYear`, and `bankAccounts` values.

---

## ~~54. Currencies — Remove IDR, KRW, EUR from Display Cards~~ ✅ Complete

The currency card grid should only show: **CNY · GBP · USD · MYR** (4 cards = 1 row).

IDR is used internally for bond/lot rate lookups via `getRate('IDR')`, so it cannot be fully removed from the `CURRENCIES` array — add `hidden:true` to its entry instead.

**Changes in `app.js`:**
1. In the `CURRENCIES` array (line 54–57): remove KRW and EUR entries entirely; add `hidden:true` to the IDR entry
2. In the currency cards render (`.filter(...)` before `.map(...)`): change filter from `c.code !== 'JPY'` to `!c.hidden && c.code !== 'JPY'`
3. Remove `allIdr` from the total-held display line (since IDR is no longer a display currency) — or keep it if bonds are still tracked in IDR (leave as-is if bonds exist)

**Result:** 4-card grid in one row. IDR rate still available for bond calculations.

**Scope** — small. Array edit + one filter change.

Implemented (codex wrote this):
- Kept IDR in `CURRENCIES` with `hidden:true` so `getRate('IDR')` and IDR conversion helpers still work.
- Removed KRW and EUR from the display currency source list without deleting any saved `DATA.currencies` values from uploaded files.
- Currency cards and total-held calculations now use the visible currency list: CNY, GBP, USD, and MYR.
- Mobile was left unchanged because it has no currency card grid.

---

## ~~55. NISA — Compact Config + Scrollable Snapshot Table~~ ✅ Complete

Three improvements to the NISA card layout:

**1. Default snapshots reduced to 3**
- In the `DATA` literal (line 76) and `startFresh()` (line 1680): `projectionYears` default → `[currentYear, currentYear+2, currentYear+5]` (3 entries instead of 11)
- Note: this overlaps with #53 which sets it to `[]` — if #53 is done first, this change applies only to the constant DATA declaration (not startFresh which uses `[]`)

**2. Snapshot table scrolls in place**
- Wrap the `<table class="nisa-snaps">` in a `<div>` with `max-height: 180px; overflow-y: auto;`
- Keeps the table compact when entries grow; user can still add more via "+ add snapshot year"

**3. Two-column NISA config layout**
- The `.nisa-meta` block (start year / start month / this year monthly) moves to the **left column**
- The snapshot table + add button moves to the **right column**
- Use a flex row wrapper `nisa-config-row` with two children: `nisa-config-left` (meta fields) and `nisa-config-right` (snapshots)
- Left: ~200px fixed or `flex:0 0 180px`; Right: `flex:1; min-width:0`

**CSS to add (in `styles.css`):**
```css
.nisa-config-row{display:flex;gap:16px;align-items:flex-start;margin-top:12px}
.nisa-config-left{flex:0 0 180px}
.nisa-config-right{flex:1;min-width:0}
.nisa-snaps-scroll{max-height:180px;overflow-y:auto}
```

**Scope** — small. JS template restructure + 4 CSS rules.

Implemented (codex wrote this):
- Initial desktop `DATA.nisa.projectionYears` now seeds three suggested snapshot years: current year, current year + 2, and current year + 5.
- `startFresh()` keeps the #53 clean default of `projectionYears:[]`.
- NISA meta controls now sit in a left config column.
- Year snapshots now sit in a right config column with `.nisa-snaps-scroll`.
- Mobile was left unchanged because it does not render this desktop NISA config/snapshot UI.

---

## Maintenance — Expand Year Abbreviations

Implemented (codex wrote this):
- Replaced user-facing shortened year wording with full `year`, `years`, and `/year` wording.
- Renamed matching internal CSS classes and local JS variables to use `year` so editor search no longer finds the old abbreviation.
- Checked desktop and mobile class usage after the mechanical rename.
- Verified `app.js` and `mobile-app.js` syntax.

---

## 56. Savings — Collapsible Currencies and Compact Government Bonds

Requested (codex wrote this):
- Make the government bonds section collapsible so it takes less vertical space.
- When collapsed, government bonds should still show total monthly income.
- Active government bonds should render in two columns when expanded.
- Use the mobile spend section collapse pattern as a reference for the header/summary behavior.
- Make currencies collapsible too if it can be done cleanly.

Implementation notes:
- Preserve all saved `DATA` fields and bond/currency data.
- Do not remove IDR behavior; government bonds and currency lots still rely on IDR calculations.
- Keep this desktop-only unless mobile has matching savings UI.

Implemented (codex wrote this):
- Added desktop savings collapse state for currencies and government bonds.
- Government bonds are collapsed by default and show active/matured counts plus total monthly income in the header.
- Expanded active bonds render in a two-column grid.
- Currencies are collapsible and show total held in both ¥ and Rp in the header.
- Mobile was left unchanged because it does not render the desktop Savings screen.

---

## Maintenance — Project Category Label + Day Letter Abbreviations

- `project` category label updated: `ゲーム/Project` / `Project/Game` → `プロジェクト` / `Project` (app.js SPEND_CATS, renderFinance, mobile-app.js CAT_LABELS)
- `DAY_LETTER` on mobile expanded from single chars `['M','T','W','T','F','S','S']` to 3-letter abbreviations `['Mon','Tue','Wed','Thu','Fri','Sat','Sun']`

---

## 57. Bug Fix — Spend Log Breakdown Missing After JSON Reload

After importing a save file, cells in the week view show the correct ¥ total but clicking the breakdown shows no rows. Root cause: `DATA.spend[date][cat]` (the total number) is always saved, but `DATA.spendLog[date][cat]` (the line-item array with labels) may be absent if the file was saved before line items existed, or if spendLog was not present in an older export.

**Fixes:**
1. `startApp()` — add `if(!DATA.spendLog) DATA.spendLog={};` guard so load never leaves spendLog undefined
2. `openSpendLog()` — when `spendLogItems()` returns an empty array but `DATA.spend[dk][cat]` has a non-zero value, synthesise a single read-only fallback row `{amount, label:'imported total'}` so the total is visible. Fallback row has no delete button and is styled in italic/muted text
3. Once the user adds a real item, `syncSpendLog()` takes over and the fallback disappears naturally
4. CSS — `.sl-item-fallback .sl-item-label` styled italic + muted

**No data migration needed** — existing saves are unaffected; the fallback is display-only.

---

## 58. Period Tracker

Track menstrual cycles directly in the app. Designed for irregular cycles — no fixed-length assumptions, just logged history and a best-guess prediction range.

**Data model** — new array `DATA.periods`:
```js
{ id, start, end }
// start/end: "YYYY-MM-DD" strings; end may be null if cycle is still ongoing
```

**Derived calculations:**
- Cycle length = days from one `start` to the next `start`
- Period duration = days from `start` to `end` (for completed cycles)
- Average cycle length = mean of last N complete cycles (N = however many exist, min 2 to show)
- Next period estimate = last start + average cycle length, shown as a ±5 day range to reflect irregularity
- If fewer than 2 complete cycles, show "not enough data yet" instead of prediction

**Display** — new collapsible section in an appropriate view (suggestion: bottom of the Savings panel, or a dedicated tab — to be decided at implementation time):
- Header: "Period Tracker" with collapse toggle; when collapsed shows last start date + days since
- Expanded:
  - Prediction strip: "next period estimated around [date range]" (or "not enough data")
  - Average cycle: X days · average duration: X days (from logged history)
  - History list: one row per cycle — start date · end date (or "ongoing") · cycle length · duration
  - "+ log period" button: opens modal with start date (default today) and optional end date
  - Each row has an edit (pencil) and delete (×) button
  - "mark ended" button on the most recent entry if end is null

**Modal fields:**
- Start date (date input, default today)
- End date (date input, optional — can be filled in later)

**Calendar integration (optional, future):** highlight period days on the month view with a subtle background tint.

**Scope** — small-medium. New data array, one collapsible section, one modal. No graph in first pass.

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
| 10 | Day View — No-Scroll Fixed-Height Grid | 🚫 cancelled by #28 |
| 11 | Sidebar — Notes + Upcoming + Countdowns | ✅ |
| 12 | 成長投資枠 — Per-Year Lump Sum | ✅ |
| 13 | Currency — Rate Editing + Base Toggle | ✅ |
| 14 | Auto-Save via File System Access API | ✅ |
| 15 | Countdowns — Since/Until + Smart Elapsed | ✅ |
| 16 | Countdown Modal — Contextual Hints | ✅ |
| 17 | Bug Fix — Currency Toggle + Amount Input | ✅ |
| 18 | Bug Fix — NISA Lifetime Cap Description | ✅ |
| 19 | Year View — Clearer Goal Row Labels + Icons | ✅ |
| 20 | Currency Cards — Rate Label Respects Base Currency | ✅ |
| 21 | Day View — Condensed Time Grid | 🚫 cancelled by #28 |
| 22 | Currency — Purchase Lots & P&L Tracking | ✅ |
| 23 | Government Bonds Tracker (Active + Matured) | ✅ |
| 24 | Bug Fix — Currency Lots rateIDR Semantics | ✅ |
| 25 | NISA つみたて — Per-Year Monthly Amount | ✅ |
| 26 | Bank Account Totals Tracker | 🚫 cancelled |
| 27 | Weekly Finance Tracker — Income, Bills, Spending | ✅ |
| 28 | Remove Day View — Weekly Becomes Primary + Finance | ✅ |
| 29 | Merge Year + Years → Single Year View with Calendar | ✅ |
| 30 | Bug Fix — Years View: Day Badges + Equal Column Widths | ✅ |
| 31 | NISA Tracker UI Redesign | ✅ |
| 32 | Year View Redesign — Timeline, Decade Strip, Category Colors | ✅ |
| 33 | Spend Panel Auto-Expand + Week Grid Compact | ✅ |
| 34 | Finance View Redesign — Hero, Accordions, Compare | ✅ |
| 35 | Bug Fix — Daily Spend Always in ¥ | ✅ |
| 36 | Finance — Formula Input in All Fields | ✅ |
| 37 | Finance — Per-Month Breakdown + Cumulative Net | ✅ |
| 38 | Currencies — Dual Independent JPY + IDR Rates | ✅ |
| 39 | Week View — Spend Panel Always Visible | ✅ |
| 40 | Finance — Commute Category + Section Restructure | ✅ |
| 41 | Week View — Event Column Height + Spend Panel Spacing | ✅ |
| 42 | Events — Editable (text, date, colour) | ✅ |
| 43 | Events — Labelled Colour Palette + Consistent Colours Across Views | ✅ |
| 44 | Remove Bank Accounts Section | ✅ |
| 45 | Notes — Bold, Underline, Strikethrough Formatting | ✅ |
| 46 | Desktop — Line-Item Spend Log for Food, Commute, Transport | ✅ |
| 47 | Fix — ゲーム/P label → ゲーム/Project across finance view | ✅ |
| 48 | Search — Event search on desktop (topbar button + / shortcut) and mobile (Search tab) | ✅ |
| 49 | Font Scale — CSS Custom Properties + Larger Base Size | ✅ |
| 50 | Sidebar — Collapsible Toggle | ✅ |
| 51 | Settings Panel — Font Size Slider + Sidebar Default | ✅ |
| 52 | Code Cleanup — Remove Dead CSS and Unused JS | ✅ |
| 53 | Clean Defaults — Zero NISA Values + No Bank Account Presets | ✅ |
| 54 | Currencies — Remove IDR, KRW, EUR from Display Cards | ✅ |
| 55 | NISA — Compact Config + Scrollable Snapshot Table | ✅ |
| 56 | Savings — Collapsible Currencies and Compact Government Bonds | ✅ |
| 57 | Bug Fix — Spend Log Breakdown Missing After JSON Reload | ✅ |
| 58 | Period Tracker | 📋 spec |
