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
| Persistence | Browser `FileReader` API + `Blob` download | Data is saved as a local JSON file and reloaded on next visit |

There is no backend, no database, no bundler, and no package manager. The entire app ships as three files.

---

## Getting Started

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. On the splash screen, choose **start fresh** to begin with seed data, or **load save file** to restore a previous session.
3. When you're done, click **💾 save** in the top bar. This downloads `lifeOS-save.json` to your machine.
4. Next time, use **load save file** (splash screen or top bar) to pick up where you left off.

> **Note:** Because the app reads external `.css` and `.js` files, opening it directly via `file://` works in most browsers. If you hit a blank page, serve it with a simple local server instead:
> ```
> python -m http.server 8000
> ```
> Then visit `http://localhost:8000`.

---

## Data Model

All data lives in a single JavaScript object (`DATA`) that is serialised to JSON on save. The shape is:

```
DATA = {
  events:     { "YYYY-MM-DD": [{ id, text, color }] }
  tasks:      { "YYYY-MM-DD": [{ id, text, done }] }
  slots:      { "YYYY-MM-DD": { 4: "text", 9: "text", ... } }   // keyed by hour (4–23)
  spend:      { "YYYY-MM-DD": { food: { raw, val }, transport: { raw, val }, ... } }
  goals:      { "YYYY-M-N": "string" }                           // N = 0 (goal), 1 (milestone), 2 (note)
  notes:      [{ id, text, date }]
  catLabels:  { catKey: "custom label" }
  nisa:       { tsumitateMonthly, lumpSumYearly, startYear, projectionYears[] }
  currencies: { "JPY": amount, "USD": amount, ... }
}
```

---

## Views

Navigation is done via the view buttons in the top bar. The **← →** arrows move the current period forward or backward.

### Day
The default view. Shows a single day with:
- **Events** — colour-coded pills at the top of the card. Click **+ event** to add one via a modal (name, colour, date).
- **Tasks** — a checklist. Type in the input and press Enter to add. Click the checkbox to mark done; click × to delete.
- **Time slots** — hourly text inputs from 4 am to 11 pm. Type anything into a slot to record what you did or plan to do.
- **Spend** — a grid of 8 spending categories. Supports plain numbers or arithmetic expressions (e.g. `90+450+20`). The running total is shown at the bottom.

### Week
A 7-column grid (Mon–Sun) for the current week. Each column shows:
- Events for that day.
- Up to 3 filled time slots (as a compact preview).
- Tasks (click to toggle done, × to delete, type to add).
- A **+ event** button and daily spend total.

Clicking a day's column header navigates to the **day** view for that date.

### Month
A full calendar grid. Each day cell shows up to:
- 2 events (colour-coded).
- 1 open task.
- 1 filled time slot.
- Daily spend total.

Below the calendar, a **spend summary** shows the month's total broken down by category, plus a 6-month bar chart for trend comparison.

Clicking any day cell navigates to the **day** view for that date.

### Year
A 3-column grid of all 12 months. Each month block contains:
- A mini calendar with colour-coded day indicators (green = event, purple = task, blue = time slot, dark = today).
- A count of open tasks for the month.
- 3 editable goal rows per month: **→ goal**, **◎ milestone**, **· note**. Double-click the month name to jump to month view.

Clicking any mini-calendar day navigates to the **day** view.

### Years (Multi-Year)
A 5-year overview (advance in 5-year increments with ← →). Each year shows:
- A 12-month row displaying the primary goal, any events, and open tasks for each month. Click a month cell to jump to its month view.
- A **NISA contribution tracker** row showing cumulative contributions to date, with a 🎉 flag when the ¥18M lifetime cap is reached.
- A **view year →** button to jump to that year's year view.

### Savings
A dedicated screen for financial planning with two sections:

**新NISA — contribution tracker**
- Configure a monthly **つみたて投資枠** (accumulation) amount and an optional annual **成長投資枠** (growth/lump sum) amount.
- The app calculates how many years until the ¥18M lifetime cap is reached and displays a milestone banner.
- A grid of **year snapshots** shows cumulative contributions at chosen checkpoints. Add or remove years freely.
- Numbers are contribution-only — no return rate or growth projection.

**Currencies**
- Enter amounts held in 8 currencies: JPY, IDR, USD, GBP, CNY, KRW, MYR, EUR.
- Each card shows the approximate JPY equivalent based on fixed May 2026 exchange rates.
- The FX tab in the sidebar mirrors this in a compact two-column format.

---

## Sidebar

The right-hand sidebar is always visible and has four tabs:

| Tab | Content |
|---|---|
| **notes** | Free-text sticky notes with a timestamp. Add, edit inline, delete. |
| **events** | A chronological list of all events across all dates. Click a date to jump to it. |
| **spend** | The spend breakdown for the currently viewed day, plus the month running total. |
| **FX** | Currency amount inputs and JPY equivalents, mirroring the savings screen. |

---

## Spend Categories

Eight fixed categories, each with a colour. Labels can be renamed by **double-clicking** the category name in the day view's spend grid.

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

Spend inputs accept arithmetic expressions. Entering `500+200+90` displays the sum (`790`) after you press Enter or click away. The raw expression is preserved so you can see the breakdown.

---

## Seed Data

Clicking **start fresh** pre-loads a set of events and goals relevant to the user's life plan (driving exam, JLPT N1, PR eligibility milestone, etc.). These are fully editable and deletable — they are just a starting point. Loading an existing save file skips seeding entirely.
