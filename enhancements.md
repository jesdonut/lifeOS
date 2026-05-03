# lifeOS — Planned Enhancements

---

## 1. ~~Month View: Click Day → Navigate to Week (not Day)~~ ✅ Complete

**Current behaviour:** Clicking any day cell in the month grid jumps straight to the day view for that date.

**Proposed behaviour:** Clicking a day cell navigates to the *week* view containing that day, keeping the clicked day highlighted/focused. To reach the day view, the user would click the large date number in the week column header.

**Why this is better UX:**
The month → week → day hierarchy feels natural and mirrors how people think about time. Landing on a week gives more context: you can see what else is happening around that day before committing to it. Jumping from month straight to day is a two-level skip that loses the week's context entirely. The week view is also more actionable — you can quickly scan and compare several days at once.

**Details to consider:**
- When arriving at week view from month, auto-scroll or visually highlight the clicked day's column (e.g. a subtle pulse or bolder header) so the user knows where they landed.
- Keep the existing week column header click (the date number) as the way to drill into day view — it's already a natural affordance.

---

## 2. ~~Day Page: Two-Column Layout — Time Slots + Spend Side by Side~~ ✅ Complete

**Current behaviour:** The day view is a single centred card (max 640px wide) with time slots stacked above the spend grid. On wider screens there is a lot of dead space on either side, and the user must scroll past ~20 hour rows to reach the spend section.

**Proposed layout:**
Split the day card body into two columns side by side:
- **Left column (~60%):** the events row, tasks, and time slots — the "plan" side.
- **Right column (~40%):** the spend grid and daily total — always visible, no scrolling needed.

The header (date, day-of-week, today badge) spans the full width as before.

**Why this is better UX:**
- Spend tracking is a frequent action (quick entry after each purchase). Burying it below 20 rows of hourly inputs creates unnecessary friction.
- The two-column split reclaims the blank side margins that currently just show the background. On a typical 1280px+ laptop screen this is a big chunk of wasted space.
- Having both panels visible at once lets the user plan their day and log spend without any context switch — it reads as "here's my day, here's what I spent."
- The right column height naturally matches the left on most days, so it won't feel lopsided.

**Details to consider:**
- On narrow screens / mobile the layout should stack back to single-column (the original order: plan on top, spend below).
- The spend column could get a sticky position so it stays in view while the user scrolls through a long list of hourly slots.

---

## 3. ~~Day Page: Flexible Time Blocks (Multi-Hour & Half-Hour Entries)~~ ✅ Complete

**Current behaviour:** Each hour from 4am–11pm is a separate single-line text input. There is no way to express that an event spans 2 hours, starts at :30, or continues across a slot boundary.

**Proposed approach — "click to add block" on a time grid:**
Replace the plain input rows with a visual time grid. Clicking (and optionally dragging) a range of slots opens a small popover to enter a label. The resulting entry renders as a coloured block that visually spans the selected time range.

- A block stores: `startHour`, `startMin` (0 or 30), `endHour`, `endMin`, `text`, `color`.
- Clicking an existing block opens it for editing or deletion.
- The grid shows 30-minute rows (double the current density), with hour labels only on the :00 row to avoid clutter.
- A block can span any continuous range — 30 min, 90 min, 3 hours, etc.

**Why this is better UX:**
- Real life doesn't fit into hourly buckets. A gym session is 75 minutes, a commute is 45, a meeting is 2 hours. The current system forces the user to either pick the closest hour or awkwardly duplicate text across rows.
- A visual block makes the day's shape immediately legible — busy vs. free time is visible at a glance, not buried in a list of text inputs.
- Drag-to-create is fast and tactile. The popover keeps the entry flow lightweight (no modal, no navigation).

**Details to consider:**
- Keep a "quick type" fallback: clicking a single 30-min slot without dragging should let the user just type a label inline, the same as today but at 30-min granularity.
- Overlap handling: if two blocks overlap, offset them side by side (like a real calendar) rather than hiding one.
- The week view should reflect multi-hour blocks in its compact slot preview (show the first block's label rather than the first filled hour).

---

## 4. Visual Restyling — Pastel Pink / Warm Cute Palette

**Current palette:** Muted olive-green accent on a warm off-white base. Clean and minimal but neutral/utilitarian in feel.

**Proposed palette direction — "sakura studio":**

| Token | Current | Proposed |
|---|---|---|
| `--bg` | `#f5f4f0` (warm grey) | `#fdf6f8` (blush white) |
| `--surface` | `#ffffff` | `#ffffff` |
| `--surface2` | `#f0efe9` | `#fdf0f3` (very pale pink) |
| `--border` | `#e0dfd8` | `#f0d9e0` (dusty rose border) |
| `--border2` | `#cccbc3` | `#ddb8c4` |
| `--accent` | `#2d5a3d` (forest green) | `#c2607a` (warm rose) |
| `--accent-light` | `#e8f0ea` | `#fce8ee` (blush) |
| `--text` | `#1a1916` | `#2d1f25` (warm near-black) |
| `--text2` | `#6b6a63` | `#8a6672` (mauve-grey) |
| `--text3` | `#a09f98` | `#c4a0aa` (dusty pink) |

**Additional touches:**
- Soft lavender (`#e8e0f5` / `#9b7ec8`) as a secondary accent for tasks (replacing the current purple), giving a coordinated analogous palette.
- A pale sky blue (`#daeaf5` / `#4a7fa5`) retained for the schedule/slot blocks — it contrasts pleasantly with the pinks without clashing.
- Slightly rounder radius tokens: `--radius: 8px`, `--radius-lg: 14px` — rounder corners reinforce the soft aesthetic.
- The splash screen logo could use a gradient text (rose → lavender) for a touch of personality.
- Today's badge and the "active" view button use the rose accent, making the current position in time feel warm and welcoming rather than businesslike.

**Why this is better UX:**
A personal life planner is an intimate tool. The current palette reads more like a productivity SaaS dashboard. A warm, feminine palette makes the app feel like *her* space — something she wants to open every day. Pastel colours also reduce eye strain during the evening journaling / planning sessions where this app is likely used most.

---

## Implementation Order (suggested)

1. **#4 Restyling** — purely CSS, zero risk of breaking logic, instant visual payoff.
2. **#2 Two-column day layout** — HTML/CSS restructure, improves usability immediately.
3. **#1 Month → week navigation** — one-line JS change, low effort, high polish.
4. **#3 Flexible time blocks** — most complex (new data model + drag interaction), do last.
