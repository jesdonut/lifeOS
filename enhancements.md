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

## 22. Currency — Purchase Lots & P&L Tracking

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

## 23. Government Bonds Tracker (Active + Matured)

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
| 10 | Day View — No-Scroll Fixed-Height Grid | ⏳ on hold |
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
| 21 | Day View — Condensed Time Grid | ⏳ pending |
| 22 | Currency — Purchase Lots & P&L Tracking | ⏳ pending |
| 23 | Government Bonds Tracker (Active + Matured) | ⏳ pending |
