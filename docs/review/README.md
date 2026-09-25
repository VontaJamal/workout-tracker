# Form redesign review

A colorful consistency dashboard with actual workout details behind every calendar day. Main and supplemental work is grouped by exercise; explicit circuit workouts present each movement equally. Watch stats and a Hall of Fame make each day's effort and all-time records easy to inspect.

## Current preview and proof

All artifacts contain **synthetic workouts only**, on `cx/playful-workout-redesign`, now synchronized with `origin/main` at `930345e`. The latest merge adds workout-planning guidance without changing application code. The following evidence commit changes only this review directory.

- `db0ff8a`: interactive strength-point and bodyweight screenshots, plus the strength-points-after recording. Dots show date, weight, and reps on hover, focus, click, or tap. The matching before proof uses `dd550fe`.
- `95e96ac`: desktop/phone exercise-selection and record-selection screenshots, plus the exercise-selectors recording. Both exercise selectors omit internal load codes and repeated pound labels.
- `cff2c59`: full desktop/phone dashboards, training-max screenshots, and the navigation-after recording. Training maxes round down to the nearest 5 and omit overhead press for now.
- `3429b29`: strength/circuit screenshots and workout-details recording, showing Set, Weight, Reps, and Notes without repeated pound labels.
- `2fd3a89`: other overview, cardio, and Hall of Fame screenshots.

- [Desktop overview](desktop-overview.png) and [full desktop dashboard](desktop.png)
- [Phone overview](mobile-overview.png) and [full phone dashboard](mobile.png)
- [Main and supplemental work: desktop](strength-1440.png) / [phone](strength-390.png)
- [Circuit: desktop](circuit-1440.png) / [phone](circuit-390.png)
- [Watch stats: desktop](watch-1440.png) / [phone](watch-390.png)
- [Training maxes: desktop](training-maxes-1440.png) / [phone](training-maxes-390.png)
- [Hall of Fame: desktop](hall-of-fame-1440.png) / [phone](hall-of-fame-390.png)
- [Strength exercise selector: desktop](exercise-selection-1440.png) / [phone](exercise-selection-390.png)
- [Records exercise selector: desktop](record-selection-1440.png) / [phone](record-selection-390.png)
- [Simplified exercise selectors recording](exercise-selectors.mp4)
- [Interactive strength points: desktop](strength-points-1440.png) / [phone](strength-points-390.png)
- [Bodyweight point: desktop](strength-bodyweight-1440.png) / [phone](strength-bodyweight-390.png)
- [Strength points before](strength-points-before.mp4) / [after](strength-points-after.mp4)
- [Workout details and records recording](workout-details-and-records.mp4)
- [Navigation before the fix](navigation-before.mp4) / [stable navigation and simplified details](navigation-after.mp4)

Run `npm run build` and `node scripts/preview.cjs`, then open <http://localhost:4182>. No account needed. The local preview substitutes synthetic data, rejects writes, and never reads Sheets. The three most recent occupied calendar days demonstrate main/supplemental work, a circuit, and a watch-recorded run.

Other states: `?state=empty`, `?state=signed-out`, `?state=restricted`, `?state=setup`, `?state=error`. Add `?delay=1` to inspect refreshing. Authentication submission is tested against the normal application with an isolated local database, not through this read-only preview.

## Validation

- Type checking, ESLint, targeted Prettier checks, production build, and diff checks passed.
- All 41 unit/component tests passed, including existing access-control and strength-data tests. New coverage checks point hover/click/keyboard interaction, Escape, single-point bodyweight and range changes, workout grouping, equal circuit treatment, hidden RIR/rep-quality and provenance labels, training-max rounding boundaries and overhead-press filtering, watch fields, missing values, secure source links, same-load records, equipment/unit isolation, duplicate sets, and daily totals across multiple sessions.
- Both Cypress smoke tests passed: signup, logout, login, restricted access, and notes. Route and heading assertions guard against interacting with the previous screen during navigation.
- Six synthetic-dashboard Cypress tests passed: strength-point selection, exact values, keyboard dismissal, exercise changes, single-point/bodyweight charts, first and repeated section navigation on desktop and phone, focus, query preservation, no loader reads during section jumps, back/forward restoration, skip/latest-workout shortcuts, and cardio/training labels. Run `npm run test:dashboard` after building; this starts an isolated synthetic preview on port 8812.
- The simplified four-column set layout passed browser checks in both calendar dialogs and the journal at 320, 390, and 1440 pixels, with no page or dialog overflow. Pound weights show numbers without repeated lb labels; bodyweight remains explicit. Phone notes use the full row.
- The synthetic training-max card shows Bench press 180, Squat 245, and Deadlift 290 on desktop and phone. Overhead press is hidden. Rounding tests cover decimals, exact multiples, formatted numbers, zero, missing/invalid values, and source-data preservation.
- Both exercise selectors display Romanian deadlift · Dumbbells, without internal load codes or repeated pound labels. Browser checks at 320, 390, and 1440 pixels verified selection, unchanged underlying IDs, actual-data readouts, bodyweight, focus, no page overflow, and no browser errors or Axe violations.
- Point interaction checks passed at 320, 390, 768, and 1440 pixels: hover, click, touch, Tab/Enter/Space/Escape, hoverable tooltips bounded to the visible chart, stable press targets, synchronized session selection, all ranges, dense history, single-point/bodyweight, and reduced motion. Dense charts preserve separate 32-pixel targets through horizontal scrolling. No browser errors or Axe violations were found.
- Browser checks passed for shared ranges, keyboard calendar selection, modal focus/Escape/close/return, bodyweight progression, history expansion/filter/pagination, refresh/retry, connection states, and reduced motion.
- Updated strength, circuit, watch, and Hall of Fame interactions passed at 320, 390, 768, and 1440 pixels. Overall range/layout checks also passed at 1024 pixels. No horizontal page or dialog overflow; chart areas scroll inside their panels.
- Touch opening/closing and exercise/weight selection passed. Hall of Fame values stay unchanged when switching overview ranges.
- Axe WCAG 2 A/AA and 2.1 AA scans reported zero violations for the updated overview, records, and open strength/circuit/watch dialogs on desktop and phone. Earlier login, signup, empty/error/access scans passed. Automated scans do not establish complete accessibility certification.

## Strength-point regression

Before this fix, the SVG circles had no interaction handlers or accessible controls. Hovering or clicking the first dot left the latest-session readout unchanged and displayed no tooltip. Two new component regressions failed before implementation (7 prior tests passed). The [before screenshot](strength-points-before.png) and recording preserve the visible behavior at `dd550fe`.

Each dot now has a native button with its exact date, weight, and reps as its accessible name. Hover, focus, click, and tap show a popup and update the existing session selector/readout. Escape dismisses even when the tooltip was opened by hover and focus is outside the chart. Popup placement stays inside the visible chart after scrolling; changing ranges or exercises clears stale details. The full chart component suite now passes 9 tests. Reproduce with `npm run test -- --run --threads=false app/components/charts.test.tsx` and `npm run test:dashboard` after building.

## Navigation regression

Before the fix, the Hall of Fame link jumped to its section and then back to the top. A failing browser assertion measured the section 2151.55 pixels below the viewport after the jump. Native fragment links created history entries without router keys, so scroll restoration could override the fragment destination with a saved position. All five section links now use the existing router, preserve query parameters, and move keyboard focus without a separate focus scroll. The same browser assertion passes after the fix at 1440 and 390 pixels. The before recording uses `81eaf56`; the current after recording uses `cff2c59`.

## Data behavior

Sessions and training days count distinct IDs and dates. Weeks start Monday in Eastern Time and the current week is partial. Missing cardio durations stay unknown and incomplete totals are labeled.

Main/supplemental grouping uses existing session focus, set type, and category fields. Explicit circuit labels in Workout, Focus, or Main Lift Focus present all exercises equally. Unclassified sessions use a neutral Exercises group. RIR and rep-quality metadata remain in the source but are hidden in the interface; eligibility rules still exclude failed sets from progression and derived records.

Set details show only Set, Weight, Reps, and Notes. Weight is the actual recorded load. Pound weights omit repeated lb labels; other units and bodyweight remain explicit. Planned weights remain in the source data and are omitted from calendar and journal details.

Strength progress and Hall of Fame exercise selectors share concise exercise/equipment labels. Bodyweight and non-pound units remain explicit, while internal load codes and default pound labels are omitted. Selection IDs still separate exercise key, equipment, load type, and unit.

Historical lift records come directly from Rep PRs and are never overwritten by recent workouts. Logged rep bests compare exercise key, equipment, load type, unit, and actual weight. Daily totals combine eligible working sets across sessions on the same recorded date and count duplicate set IDs once. Bodyweight records use reps without invented weight. Training maxes remain separate programming values.

Cardio details read existing watch-stat columns and omit internal recorded-source and distance-source labels. Session or cardio notes may hold an HTTPS link to an original photo/video, which opens at its current host using its existing access permissions. Training maxes display base weights rounded down to the nearest 5, with overhead press hidden for now; repeated unit labels and internal program-input numbers are omitted. This display rule does not change spreadsheet values, recorded workout loads, or historical records. No media uploads, automatic extraction, or chat-attachment ingestion are implemented. No spreadsheet, database-schema, API, or production-configuration changes are included.

## Earlier review artifacts

The [phone login](login.png) and [initial overview recording](interaction.mp4) came from `f74f980`. The [first calendar drilldown recording](calendar-details.mp4), [desktop](calendar-details-desktop.png), and [phone](calendar-details-mobile.png) came from `bc6963b` and show the earlier detail layout. [Before drilldown](calendar-before.png) preserves the count-only interaction for comparison.
