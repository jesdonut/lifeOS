# lifeOS

> ⚠️ This is a personal-use repository. A public version is in development at [lifeOS 2.0](https://github.com/jesdonut/lifeOS2.0).

A personal life planner that lives entirely in your browser. No accounts, no cloud, no installs — just open `index.html` and go.

A mobile companion (`mobile.html`) is also live — optimised for on-the-go daily expense tracking. Opening the site on a phone auto-redirects to the mobile version.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Structure | HTML5 | `index.html` (desktop entry + mobile redirect) + `mobile.html` (mobile) |
| Styles | Plain CSS (`desktop.css`, `mobile.css`) | CSS custom properties for theming; no framework |
| Logic | Vanilla JavaScript (`desktop.js`, `mobile.js`) | No dependencies, no build step |
| Fonts | Google Fonts | DM Mono (monospaced) + DM Sans (UI text), loaded via `@import` |
| Persistence (desktop) | File System Access API (Chrome) + fallback download | Auto-saves to a local JSON file |
| Persistence (mobile) | `localStorage` + manual export | Saves silently on every change; export button for JSON download |

There is no backend, no database, no bundler, and no package manager.

---

## Getting Started

### Desktop
1. Open `index.html` in Chrome (recommended) or another modern browser. The desktop app loads `desktop.js` and `desktop.css`.
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
  nisa:         { tsumitateMonthly, tsumitateByYear, lumpSumByYear,
                  startYear, startMonth, projectionYears[] }
  currencies:   { "JPY": amount, "USD": amount, ... }
  currencyRates: { "USD": { jpy: 149.5, idr: 16000 }, ... }  // independent rates per currency
  currencyLots: [{ id, code, amount, rateIDR, date }]
  bonds:        [{ id, series, faceValue, couponRate, taxRate,
                   settlementDate, firstCouponDate, maturityDate, matured }]
  bankAccounts: [{ id, name, currency, balance }]  // preserved for older saves; not shown in UI
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
  period:       { enabled: boolean,
                  defaultLength: number,            // days (default 5)
                  entries: [{ id, start, length }], // start: "YYYY-MM-DD"
                  symptomLogs: [{ id, date, time, flow, symptoms: [keys] }] }
                  // flow: one of none/spotting/light/medium/heavy
                  // symptoms: array of keys from SYMPTOM_CATS constant
}
```

---

## Views

Navigation is in the top bar. The **← →** arrows move the current period. Clicking the **lifeOS** logo jumps to today's week.

Nav order: **week → month → year → finance → savings** (+ **period** when enabled in settings)

---

### Week

A 7-column grid (Mon–Sun). Each column shows events, tasks, and a daily spend total. Click any column header to jump to that date's week.

**Events** — click any event pill to edit its name, date, or colour. The × button deletes directly. Adding an event opens a modal with a labelled colour picker (9 named categories).

**Spend panel** — always visible below the event grid: 10 category rows × 7 day columns. Type any amount (or an arithmetic expression like `1200+800`) and it saves immediately. Negative values are supported. Totals per day update live. The Finance tab reads these entries automatically.

---

### Month

A full calendar grid. Each day cell shows up to 3 events (+ "+N more"), 1 open task, and the daily spend total. Click any cell to jump to that week.

---

### Year

A redesigned multi-year view showing 5 years at a time.

**Decade strip** — 11 clickable mini-cards at the top: year, age, and coloured dots showing which event categories have activity that year. Click any card to jump to that year.

**Year cards** — each year renders as a card with:
- **3-column header**: year + age + category count badges (work / life / learn / travel) | one-line editable summary | NISA progress bar + cumulative total + % of ¥18M cap
- **Timeline** — 12-column CSS grid showing events as coloured chips positioned by month, stacked into parallel tracks if a month has multiple events
- **Footer** — 3-column row: ★ aim / ▶ checkpoint / — note (year-level, inline editable)

Years with no events collapse to a single line. Click to expand.

**Event colours** — each event carries its own colour chosen at creation. The 9 available colours and their labels:

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

**Balance formula:** Income − Commute − Food − Fixed − Necessities − Optional

---

### Savings

A financial planning screen with three sections.

**NISA tracker** — つみたて + 成長 investment tracking, projections to ¥18M lifetime cap.

**Currencies** — CNY, GBP, USD, MYR cards with JPY and IDR equivalents. Purchase lot tracking with P&L.

**Government bonds** — Indonesian retail bonds (ORI, SR, ST, etc.). Monthly coupon tracking, maturity dates, progress bars. Maturity is one-way — once marked matured, cannot be reactivated.

---

### Period *(enable in Settings → Period Tracker)*

A menstrual cycle tracker showing a full year at a glance. 6 months per row, 5 future predictions, travel-aware prediction, fertile window, ovulation estimate, symptom logging, BBT tracking, flow levels.

---

## Sidebar

| Tab | Content |
|---|---|
| **notes** | Free-text sticky notes with a timestamp. |
| **upcoming** | Unified feed: countdown timers, events within 60 days, bond maturity dates, goals for future months. |
| **countdowns** | Named date trackers with until/since modes and optional yearly repeat. |
