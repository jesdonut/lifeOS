# lifeOS

A personal life planner that lives entirely in your browser. No accounts, no cloud, no installs — just open `index.html` and go.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Structure | HTML5 | Single `index.html` entry point |
| Styles | Plain CSS (`styles.css`) | CSS custom properties for theming; no framework |
| Logic | Vanilla JavaScript (`app.js`) | No dependencies, no build step |
| Fonts | Google Fonts | DM Mono (monospaced) + DM Sans (UI text), loaded via `@import` |
| Persistence | File System Access API (Chrome) + fallback download | Auto-saves to a local JSON file; falls back to manual download on unsupported browsers |

There is no backend, no database, no bundler, and no package manager. The entire app ships as three files.

---

## Getting Started

1. Open `index.html` in Chrome (recommended) or another modern browser.
2. On the splash screen, choose **start fresh** to begin with a blank slate, or **load save file** to restore a previous session.
3. On first start you'll be asked once where to save your file (`lifeOS-save.json`). After that the app auto-saves silently after every change. A faint "✓ saved" indicator appears in the top bar.
4. Next time, click **load** in the top bar (or use the splash screen) to reopen your save file.

> **Safari / Firefox:** The File System Access API is not supported. A **💾 save** button appears instead — click it to download your save file. Safari will also show a warning suggesting Chrome for auto-save.

> **Local file:// note:** Opening directly via `file://` works in most browsers. If you get a blank page, serve with:
> ```
> python -m http.server 8000
> ```
> Then visit `http://localhost:8000`.

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
  currencyRates: { "USD": 149.5, ... }   // JPY base = 1
  baseCurrency: "JPY" | "IDR"
  currencyLots: [{ id, code, amount, rateIDR, date }]
  bonds:        [{ id, series, faceValue, couponRate, taxRate,
                   settlementDate, firstCouponDate, maturityDate, matured }]
  bankAccounts: [{ id, name, currency, balance }]
  finance:      { "YYYY-MM": { salary, transportReimb, otherIncome, momPays,
                               taxWithheld, insuranceDed, commutationPass,
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

**Spend panel** — click **▾ log spending** below the grid to open a spreadsheet-style panel: 9 category rows × 7 day columns. Type any amount and it saves immediately. Totals per day update live. The Finance tab reads these entries automatically.

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

**Event category colours** — inferred from event colour:
| Category | Colour |
|---|---|
| work | `#c8456c` (rose) |
| life | `#5a8fc8` (blue) |
| learn | `#c87a3a` (orange) |
| travel | `#4a8a5a` (green) |

---

### Finance

A monthly income and spending tracker. Navigate months with the **← →** arrows.

Sections:

| Section | Input type | Fields |
|---|---|---|
| **Income** | Manual | Salary, transport reimbursement, other income, mom pays, tax withheld (−), insurance deducted (−) |
| **Fixed Monthly** | Manual | Commutation pass, rent, gas, water, electricity, phone, internet |
| **Food** | Auto from daily spend | 食べ物 |
| **Transport** | Auto from daily spend | 電車代金 |
| **Necessities** | Auto from daily spend | Paperwork, medical, necessities, NHI |
| **Optional** | Auto from daily spend | Game/project, entertainment, clothes/hair |

The four auto sections pull directly from daily entries logged in the week view's spend panel. You never type these totals manually — they aggregate automatically.

**Balance formula:** Income − Fixed − Food − Transport − Necessities − Optional

All sections are collapsible. Auto sections are marked with a "from daily entries" badge.

---

### Savings

A financial planning screen with four sections.

**NISA tracker**
- Hero strip: lifetime plan total + stacked progress bar (つみたて pink / 成長 navy), projected cap year, this year's total, average per year
- Two-panel editor: つみたて 投資枠 (per-year monthly amount table) | 成長投資枠 (per-year lump sum table, collapses empty rows)
- Meta strip: start year, start month, this year's monthly contribution
- Snapshot table: chosen checkpoint years with cumulative totals and mini progress bars
- Lifetime cap ¥18M — つみたて ¥1.2M/yr · 成長 ¥2.4M/yr · up to ¥3.6M/yr combined

**Bank accounts**
- Track cash balances across accounts (BCA in IDR, MUFG in JPY, etc.)
- Editable balances with live conversion to base currency
- Total row in base currency

**Currencies**
- Enter amounts held in 8 currencies: JPY, IDR, USD, GBP, CNY, KRW, MYR, EUR
- Toggle **JPY / IDR** as base currency; all cards and totals update
- Edit exchange rates inline per card
- **Purchase lots** — per-currency collapsible table tracking individual purchases: date, amount, total IDR cost, current rate, P&L
- **Total held** row across all currencies in base currency

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

Nine fixed categories used in the week view spend panel and aggregated into the Finance tab:

| Key | Japanese | English | Finance group |
|---|---|---|---|
| `food` | 食べ物 | Food | Food |
| `transport` | 電車代金 | Transport | Transport |
| `paperwork` | 書類仕事 | Paperwork | Necessities |
| `medical` | メディカル | Medical | Necessities |
| `necessities` | 日常生活 | Necessities | Necessities |
| `nhi` | 国民保険 | NHI | Necessities |
| `project` | ゲーム/P | Game/Project | Optional |
| `fun` | エンタメ | Entertainment | Optional |
| `clothes` | 服・髪 | Clothes/Hair | Optional |
