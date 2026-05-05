# lifeOS

A personal life planner that lives entirely in your browser. No accounts, no cloud, no installs — just open `index.html` and go.

A mobile companion (`mobile.html`) is also live — optimised for on-the-go daily expense tracking. Opening the site on a phone auto-redirects to the mobile version.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Structure | HTML5 | `index.html` (desktop) + `mobile.html` (mobile) |
| Styles | Plain CSS (`styles.css`, inline in `mobile.html`) | CSS custom properties for theming; no framework |
| Logic | Vanilla JavaScript (`app.js`, `mobile-app.js`) | No dependencies, no build step |
| Fonts | Google Fonts | DM Mono (monospaced) + DM Sans (UI text), loaded via `@import` |
| Persistence (desktop) | File System Access API (Chrome) + fallback download | Auto-saves to a local JSON file |
| Persistence (mobile) | `localStorage` + manual export | Saves silently on every change; export button for JSON download |

There is no backend, no database, no bundler, and no package manager.

---

## Getting Started

### Desktop
1. Open `index.html` in Chrome (recommended) or another modern browser.
2. On the splash screen, choose **start fresh** to begin with a blank slate, or **load save file** to restore a previous session.
3. On first start you'll be asked once where to save your file (`lifeOS-save.json`). After that the app auto-saves silently after every change. A faint "✓ saved" indicator appears in the top bar.
4. Next time, click **load** in the top bar (or use the splash screen) to reopen your save file.

> **Safari / Firefox:** The File System Access API is not supported. A **💾 save** button appears instead — click it to download your save file.

> **Local file:// note:** Opening directly via `file://` works in most browsers. If you get a blank page, serve with `python -m http.server 8000` and visit `http://localhost:8000`.

### Mobile
Opening the site on a phone auto-redirects to `mobile.html`. The mobile app is optimised for daily expense tracking on the go.

1. On the splash screen, tap **load save file** to import your existing data, or **start fresh**.
2. Every change saves automatically to `localStorage` — no dialogs.
3. Next visit shows **continue last session** to resume instantly.
4. When done for the day, tap **export ↑** (top-right) to download the JSON, then AirDrop it to your Mac and load it in the desktop app.

A small **desktop →** link is available if you need to switch to the full version.

---

## Data Model

All data lives in a single JavaScript object (`DATA`) serialised to JSON on save.

```
DATA = {
  events:       { "YYYY-MM-DD": [{ id, text, color }] }
  tasks:        { "YYYY-MM-DD": [{ id, text, done }] }
  slots:        { "YYYY-MM-DD": [{ id, startH, startM, endH, endM, text }] }
  spend:        { "YYYY-MM-DD": { food: number, transport: number, ... } }
  goals:        { "YYYY-M-N": string }   // N = 0 (aim), 1 (checkpoint), 2 (note)
                                          // month 0 = year-level entry
                                          // key "YYYY-sum" = one-line year summary
  notes:        [{ id, text, date }]
  countdowns:   [{ id, label, date, yearly, color, mode }]  // mode: 'until' | 'since'
  nisa:         { tsumitateByYear, lumpSumByYear, startYear, startMonth, projectionYears[] }
  currencies:   { "JPY": amount, "USD": amount, ... }
  currencyRates: { "USD": { jpy: 149.5, idr: 16000 }, ... }  // independent rates per currency
  currencyLots: [{ id, code, amount, rateIDR, date }]
  bonds:        [{ id, series, faceValue, couponRate, taxRate,
                   settlementDate, firstCouponDate, maturityDate, matured }]
  spendLog:     { "YYYY-MM-DD": { food: [{ id, amount, label }],
                                  commute: [...], transport: [...] } }
  finance:      { "YYYY-MM": { salary, transportReimb, otherIncome, momPays,
                               // pre-May 2025 deductions:
                               taxWithheld, insuranceDed,
                               // May 2025+ deductions (7 split fields):
                               healthIns, careIns, childRearing, pensionIns,
                               employmentIns, incomeTax, residentTax,
                               // commute:
                               commutationPass,
                               // fixed bills:
                               rent, gas, water, electricity, phone, internet } }
}
```

---

## Views

Navigation is in the top bar. The **← →** arrows move the current period. Clicking the **lifeOS** logo jumps to today's week.

Nav order: **week → month → year → finance → savings**

---

### Week

A 7-column grid (Mon–Sun). Each column shows events, tasks, and a daily spend total. Click any column header to jump to that date's week.

**Events** — click any event pill to edit its name, date, or colour. The × button deletes directly. Adding an event opens a modal with a labelled colour picker (9 named categories).

**Spend panel** — always visible below the event grid: 10 category rows × 7 day columns. Type any amount (or an arithmetic expression like `1200+800`) and it saves immediately. Negative values are supported. Totals per day update live. The Finance tab reads these entries automatically.

---

### Month

A full calendar grid. Each day cell shows up to 2 events, 1 open task, and the daily spend total. Click any cell to jump to that week.

---

### Year

A redesigned multi-year view showing 5 years at a time.

**Decade strip** — 11 clickable mini-cards at the top: year, age, and coloured dots showing which event categories have activity that year. Click any card to jump to that year.

**Year cards** — each year renders as a card with:
- **3-column header**: year + age + category count badges (work / life / learn / travel) | one-line editable summary | NISA progress bar + cumulative total + % of ¥18M cap
- **Timeline** — 12-column CSS grid showing events as coloured chips positioned by month, stacked into parallel tracks if a month has multiple events
- **Footer** — 3-column row: ★ aim / ▶ checkpoint / — note (year-level, inline editable)

Years with no events collapse to a single line. Click to expand.

**Planner grid** — the detailed 12-month mini-calendar (with clickable days and per-month goal rows) only appears for the currently focused year, and only for months that have at least one event.

**Event colours** — each event carries its own colour chosen at creation. All views (week, month, year timeline) render events with a tinted background and coloured text using the event's colour directly. The 9 available colours and their labels:

| Label | Hex | Year category |
|---|---|---|
| education | `#8FAFA2` | learn |
| family | `#86AFC5` | life |
| friends | `#7C9CCB` | life |
| health | `#C79A9A` | life |
| partner | `#B7A6B5` | life |
| personal | `#D69AA5` | life |
| project | `#C49A73` | work |
| travel | `#D1B36A` | travel |
| work | `#B8C89A` | work |

---

### Finance

A monthly income and spending tracker. Navigate months with the **← →** arrows.

**Hero strip (3-column):**
- Large balance + MoM delta (green if up, red if down)
- 6-month sparkline of income and balance
- Income proportion bar: colored segments showing what share goes to each category

**Two-column body:**
- Left: accordion sections (Income open by default, others collapsed)
- Right: per-month breakdown — Income, Commute, Food, Fixed, Necessities, Optional, Net for the current month; plus a **Total since Jan 2025** cumulative net at the bottom

**Sections (in order):**

| Section | Input type | Fields |
|---|---|---|
| **Income** | Manual | Salary, transport reimbursement, other income, mom pays; pre-May 2025: tax withheld (−), insurance (−); May 2025+: 7 split deductions (health, care, child-rearing, pension, employment, income tax, resident tax) |
| **Commute** | Manual + Auto | 通勤定期券 commutation pass (manual) + 通勤費 daily commute spend (auto) |
| **Food** | Auto from daily spend | 食べ物 |
| **Fixed Monthly** | Manual | Rent, gas, water, electricity, phone, internet |
| **Necessities** | Auto from daily spend | Transport (電車代金), paperwork, medical, daily (日常生活), NHI |
| **Optional** | Auto from daily spend | Project/game, entertainment, clothes/hair |

Auto sections pull directly from daily entries in the week view spend panel. Manual sections show a fill count and highlight entered fields with an accent border. All manual fields accept arithmetic expressions (e.g. `50000*2`).

**Balance formula:** Income − Commute − Food − Fixed − Necessities − Optional

---

### Savings

A financial planning screen with three sections.

**NISA tracker**
- Hero strip: lifetime plan total + stacked progress bar (つみたて pink / 成長 navy), projected cap year, this year's total, average per year
- Two-panel editor: つみたて 投資枠 (per-year monthly amount table) | 成長投資枠 (per-year lump sum table, collapses empty rows)
- Meta strip: start year, start month, this year's monthly contribution
- Snapshot table: chosen checkpoint years with cumulative totals and mini progress bars
- Lifetime cap ¥18M — つみたて ¥1.2M/yr · 成長 ¥2.4M/yr · up to ¥3.6M/yr combined

**Currencies**
- Enter amounts held in 8 currencies: JPY, IDR, USD, GBP, CNY, KRW, MYR, EUR
- Each currency card has two independent editable rate fields: `1 CODE = X ¥` and `1 CODE = Y Rp` — changing one does not affect the other
- Equivalent shown as both ¥ and Rp on every card
- **Purchase lots** — per-currency collapsible table tracking individual purchases: date, amount, total IDR cost, current rate, P&L
- **Total held** row shows both ¥ and Rp totals

**Government bonds**
- Track Indonesian retail bonds (ORI, SR, ST, SBR, etc.)
- Fields: series, face value, coupon rate, tax rate, settlement date, first coupon date, maturity date
- Derived per bond: gross/net monthly coupon, total coupons earned, coupons remaining, months to maturity
- Active bonds and matured archive (collapsed)
- Summary: total net monthly income across all active bonds
- Maturity dates appear in the **upcoming** sidebar tab

---

## Sidebar

The right-hand sidebar is always visible and has three tabs:

| Tab | Content |
|---|---|
| **notes** | Free-text sticky notes with a timestamp. Add, edit inline, delete. |
| **upcoming** | Unified feed sorted soonest first: countdown timers, events within 60 days, bond maturity dates, and goals for future months. |
| **countdowns** | Add, edit, and delete named date trackers. Each entry has a label, date, optional yearly repeat, colour, and mode. |

---

## Countdowns

Each countdown has a **mode**:

- **until** — counts down to a future date. Shows "in X days" or "today!". With yearly repeat, recurs annually.
- **since** — tracks elapsed time from a past date. Shows "X days since", "X months since", or "X yrs Y mo since". With yearly repeat, switches to birthday/anniversary mode: "age X · turning Y in Z days".

In the **upcoming** tab, `until` entries and `since + yearly` entries appear as future events. Plain `since` entries (one-off trackers) are excluded.

---

## Spend Categories

Ten fixed categories used in the week view spend panel and aggregated into the Finance tab:

| Key | Japanese | English | Finance group |
|---|---|---|---|
| `food` | 食べ物 | Food | Food |
| `commute` | 通勤費 | Commute | Commute (transport group) |
| `transport` | 電車代金 | Transport | Necessities |
| `paperwork` | 書類仕事 | Paperwork | Necessities |
| `medical` | メディカル | Medical | Necessities |
| `necessities` | 日常生活 | Daily | Necessities |
| `nhi` | 国民保険 | NHI | Necessities |
| `project` | ゲーム/P | Project/Game | Optional |
| `fun` | エンターテインメント | Entertainment | Optional |
| `clothes` | 服・髪 | Clothes/Hair | Optional |
