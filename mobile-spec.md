# lifeOS Mobile — Spec

## Files
- `mobile.html` — separate entry point, all CSS inline in `<style>`
- `mobile-app.js` — separate logic, no shared code with `app.js`

## Routing
- Desktop (`index.html`) detects mobile via user-agent and auto-redirects to `mobile.html`

## Data
- Shares the **same save file format** as the desktop app (same `DATA` object structure)
- All DATA fields preserved as-is (NISA, bonds, currencies, etc.) — mobile reads and writes the same object, just doesn't display everything
- New field added: `spendLog` — line-item entries for food, commute, transport
  ```
  spendLog: {
    "YYYY-MM-DD": {
      food:      [{ id, amount, label }],
      commute:   [{ id, amount, label }],
      transport: [{ id, amount, label }]
    }
  }
  ```
- When mobile saves a line-item entry, it also updates `spend["YYYY-MM-DD"][category]` to the summed total — so the desktop finance view stays correct

## Persistence
- All saves go to **`localStorage`** silently (key: `lifeos-mobile-data`) — no download dialogs during use
- On next visit, splash shows **"continue last session"** to resume from localStorage
- **Export** button in bottom nav triggers a JSON download when ready to transfer (e.g. AirDrop to Mac)
- Loading a save file via the splash also writes immediately to localStorage
- `overscroll-behavior: none` on body prevents iOS pull-to-refresh; only `#m-content` scrolls

## Navigation
5 bottom tabs: **Day · Week · Year · Finance · Export**

---

## Day Tab

**Header:** ← [Day letter · Month Day] →
**Sub:** Year · age N
**Mini week strip:** M T W T F S S — dot below days with events, today highlighted in accent circle, tap any day to jump

**Events section**
- List events for the day (colour dot + label)
- Read-only (no add/edit on mobile)

**Spend section — SPEND · ¥TOTAL TODAY**

Three line-item categories (food, commute, transport):
- Collapsed by default, showing category name + running total
- Tap to expand → shows individual entries (label + amount + × delete)
- Inline add form: amount input + optional label + "+" button
- Entries save to `spendLog` and sync total to `DATA.spend`

Seven simple-input categories (paperwork, medical, necessities, nhi, project, fun, clothes):
- Single number input per day, same as desktop spend panel

---

## Week Tab

**Header:** ← [Month D–D] → / Week N · Year

**Hero strip:**
- WEEK SPEND ¥total
- Delta vs previous week (green if down, red if up)

**Day rows** (Mon–Sun):
- Day abbreviation + date number (accent colour if today)
- Coloured event dots (up to 5) or "quiet" if no events
- Daily spend total (¥), greyed if zero

Tap any day row → jumps to that day in Day tab

---

## Year Tab

**Header:** ← [Year] → / age N

**Decade strip** — horizontally scrollable row of year mini-cards:
- Year, age, coloured event dots
- Tap to focus that year (updates header + scrolls year cards)
- Shows curYear−3 to curYear+7 (11 cards)

**Year cards** (stacked vertically, curYear−2 to curYear+5):
- **Collapsed:** year · age · one-line summary · event count
- **Expanded:**
  - Editable one-line summary
  - NISA cumulative progress bar (つみたて pink / 成長 navy) + total + % of ¥18M
  - Events grouped by month as coloured chips
  - Footer: ★ aim / ▶ checkpoint / — note (inline editable textareas, auto-resize)

Year goal edits save to `DATA.goals` immediately.

---

## Finance Tab

**Header:** ← [Finance · Month] → / Year

**Balance hero:**
- Large balance (¥)
- ± vs previous month (green/red)
- No sparkline graph

**Distribution bar** — proportion bar showing income breakdown:
- Saved (green) · Fixed (blue) · Food (rose) · Commute (sage) · Necessities (gold) · Optional (mauve)
- Legend below with percentages

**Accordion sections** (tap header to expand/collapse):

| Section | Type | Fields |
|---|---|---|
| Income | Manual | Salary, Transport reimbursement, Other income, Mom pays; pre-May 2025: Tax withheld (−) + Insurance (−); May 2025+: Health insurance (−), Care insurance (−), Child-rearing insurance (−), Pension insurance (−), Employment insurance (−), Income tax (−), Resident tax (−) |
| Fixed | Manual | Rent, Gas, Water, Electricity, Phone, Internet |
| Commute | Manual + Auto | Commutation pass (manual) + Daily commute (auto) |
| Food 食べ物 | Auto | From Daily Spend — single row with JP label |
| Necessities 生活費 | Auto | Transport 電車代金 · Medical メディカル · Daily 日常生活 · NHI 国民保険 — each row shows JP + EN label and amount |
| Optional 任意支出 | Auto | Project ゲーム/Project · Entertainment エンターテインメント · Clothes 服・髪 — each row shows JP + EN label and amount |

- Income open by default, others collapsed
- Manual fields accept arithmetic expressions (e.g. `50000*2`)
- Filled fields highlighted with accent border
- Net row at bottom

**Balance formula:** Income − Commute − Food − Fixed − Necessities − Optional

---

## Out of scope for mobile
- Tasks (view or edit)
- NISA editor
- Currencies / bonds
- Countdowns / notes / upcoming sidebar
- Event add / edit (read-only)
- Year planner grid (month mini-calendar)
- Month view
