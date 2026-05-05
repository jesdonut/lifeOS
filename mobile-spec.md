# lifeOS Mobile — Spec

## Files
- `mobile.html` — separate entry point
- `mobile-app.js` — separate logic

## Data
- Shares the **same save file** as the desktop app (same DATA format)
- All DATA fields preserved as-is (NISA, bonds, currencies, etc.) — mobile reads and writes the same object, just doesn't display everything
- New field added: `spendLog` — line-item entries for food, commute, transport
  ```
  spendLog: {
    "YYYY-MM-DD": {
      food:    [{ id, amount, label }],
      commute: [{ id, amount, label }],
      transport: [{ id, amount, label }]
    }
  }
  ```
- When mobile saves a line-item entry, it also updates `spend["YYYY-MM-DD"][category]` to the summed total — so the desktop finance view stays correct

## Navigation
4 bottom tabs: **Day · Week · Year · Finance**

---

## Day Tab

**Header:** ← [Day name · Date · Year · age] →
**Mini week strip:** M T W T F S S (dot under today, tap to jump to that day)

**Events section**
- List events for the day (colour dot + label + time if set)
- Read-only on mobile (no add/edit for now)

**Spend section — SPEND · ¥TOTAL TODAY**
Three line-item categories (food, commute, transport):
- Show existing entries as rows: label + amount + × to delete
- "+ add" button opens a small inline form: amount field + optional label → saves entry, recalculates total
- Total shown per category

Seven simple-input categories (paperwork, medical, necessities, nhi, project, fun, clothes):
- Single number input per day, same as desktop

---

## Week Tab

**Header:** ← [May 4–10 · Week N · Year] →

**Hero strip:**
- WEEK SPEND ¥total
- vs last week delta (green/red)

**Day rows** (Mon–Sun):
- Day abbreviation + date number
- Event dots (coloured, one per event, max ~4)
- "quiet" label if no events
- Daily spend total (¥)

Tap a day row → jumps to that day in Day tab

---

## Year Tab

**Decade strip** — horizontally scrollable row of year cards (year + age + coloured event dots). Tap to focus that year.

**Year cards** (stacked vertically):
- **Collapsed:** single line — year · age · event count · NISA total
- **Expanded:**
  - Header: year + age + summary line (editable)
  - NISA progress bar + cumulative total + % of ¥18M
  - Events by month (month label + event chips)
  - Footer: aim / checkpoint / note (editable inline)

---

## Finance Tab

**Header:** ← [Finance · Month Year] →

**Balance hero:**
- Large balance number
- ± vs last month (colour coded)
- No sparkline graph

**Distribution bar** — same proportion bar as desktop (income → saved / fixed / food / transport / commute / necessities / optional)

**Accordion sections** (same as desktop, vertical stack):
- Income (manual fields: salary, transport reimb, other, mom pays, deductions)
- Fixed (manual: rent, gas, water, electricity, phone, internet)
- Commute (manual pass + auto from spendLog commute total)
- Food (auto from spendLog food total + spend food)
- Transport (auto from spendLog transport total + spend transport)
- Necessities (auto from spend)
- Optional (auto from spend)

No sparkline, no side-by-side layout.

---

## Out of scope for mobile
- Tasks (view or edit)
- NISA editor
- Currencies / bonds / bank accounts
- Countdowns / notes / upcoming sidebar
- Event editing (read-only)
- Year planner grid

---

## Open questions / ideas TBD
*(waiting for user's additional idea before finalising)*
