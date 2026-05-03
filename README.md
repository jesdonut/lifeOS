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
2. On the splash screen, choose **start fresh** to begin with seed data, or **load save file** to restore a previous session.
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
  spend:        { "YYYY-MM-DD": { food: { raw, val }, transport: { raw, val }, ... } }
  goals:        { "YYYY-M-N": "string" }                 // N = 0 (goal), 1 (milestone), 2 (note)
  notes:        [{ id, text, date }]
  catLabels:    { catKey: "custom label" }
  catColors:    { catKey: "#hexcolor" }
  countdowns:   [{ id, label, date, yearly, color, mode }]  // mode: 'until' | 'since'
  nisa:         { tsumitateMonthly, lumpSumByYear, startYear, projectionYears[] }
  currencies:   { "JPY": amount, "USD": amount, ... }
  currencyRates: { "USD": 149.5, ... }                   // JPY base = 1
  baseCurrency: "JPY" | "IDR"
}
```

---

## Views

Navigation is done via the view buttons in the top bar. The **← →** arrows move the current period forward or backward. Clicking the **lifeOS** logo jumps to today in day view.

### Day
The default view. Shows a single day with a two-column layout (time grid left, spend right):
- **Events** — colour-coded pills at the top. Click **+ event** to add one via a modal (name, colour, date).
- **Tasks** — a checklist. Type and press Enter to add. Click the checkbox to mark done; click × to delete.
- **Time blocks** — drag on the 30-minute grid (4 am–11 pm) to create blocks with arbitrary start/end times. Click a block to edit or delete. Blocks store start hour, start minute, end hour, end minute, and text.
- **Spend** — a grid of 8 spending categories. Supports plain numbers or arithmetic expressions (e.g. `90+450+20`). Running total shown at the bottom.

Clicking a day header in week view navigates here. Clicking the large date number in week view also navigates here.

### Week
A 7-column grid (Mon–Sun). Each column shows events, up to 3 time block previews, tasks, and the daily spend total. Clicking a column header navigates to day view for that date.

### Month
A full calendar grid. Each day cell shows up to 2 events, 1 open task, 1 time block preview, and the daily spend total. Clicking any day cell navigates to day view. Clicking the month name in week view navigates here.

### Year
A 3-column grid of all 12 months. Each month block contains a mini calendar with colour-coded day indicators and 3 editable goal rows per month: **→ goal**, **◎ milestone**, **· note**. Double-click the month name to jump to month view. Clicking any mini-calendar day navigates to day view.

### Years (Multi-Year)
A 5-year overview (advances in 5-year increments). Each year shows a 12-month row with primary goals, events, and open tasks. Includes a **NISA contribution tracker** row with a 🎉 flag at the ¥18M lifetime cap. Click a month cell to jump to its month view.

### Savings
A financial planning screen with two sections:

**新NISA — contribution tracker**
- Configure a monthly **つみたて投資枠** amount and a per-year **成長投資枠** table (each year has its own editable lump sum).
- The app calculates years until the ¥18M lifetime cap is reached.
- A grid of year snapshots shows cumulative contributions at chosen checkpoints.

**Currencies**
- Enter amounts held in 8 currencies: JPY, IDR, USD, GBP, CNY, KRW, MYR, EUR.
- Each card shows the equivalent in your base currency using editable exchange rates.
- Toggle between **JPY** and **IDR** as the base currency at the top of the section.
- Edit any exchange rate directly in the card.

---

## Sidebar

The right-hand sidebar is always visible and has three tabs:

| Tab | Content |
|---|---|
| **notes** | Free-text sticky notes with a timestamp. Add, edit inline, delete. |
| **upcoming** | Unified feed sorted soonest first: countdown timers, events within 60 days, and goals for future months. |
| **countdowns** | Add, edit, and delete named date trackers. Each entry has a label, date, optional yearly repeat, colour, and mode (until / since). |

---

## Countdowns

Countdowns live in the **countdowns** sidebar tab. Each entry has a **mode**:

- **until** — counts down to a future date. Shows "in X days" or "today!". With yearly repeat, shows "· recurring" and resets each year.
- **since** — tracks elapsed time from a past date. Shows "X days since", "X months since", or "X yrs Y mo since" depending on how long ago. With yearly repeat, switches to birthday/anniversary mode: "X yrs · turning Y in Z days".

In the **upcoming** tab, `until` entries and `since + yearly` entries (birthdays/anniversaries) appear as future events. Plain `since` entries (one-off trackers) are excluded.

---

## Spend Categories

Eight fixed categories, each with a configurable label and colour. Open **Settings** (gear icon in the spend section) to rename any category and reassign its colour from the 8-colour palette.

| Key | Default Label |
|---|---|
| `food` | Food |
| `transport` | Transport |
| `health` | Health |
| `shopping` | Shopping |
| `entertainment` | Entertainment |
| `utilities` | Utilities |
| `education` | Education |
| `other` | Other |

Spend inputs accept arithmetic expressions. Entering `500+200+90` displays the sum (`790`) and preserves the raw expression so you can see the breakdown.

---

## Seed Data

Clicking **start fresh** pre-loads sample events and goals as a starting point (driving exam, JLPT N1, PR eligibility, etc.). These are fully editable and deletable. Loading an existing save file skips seeding entirely.
