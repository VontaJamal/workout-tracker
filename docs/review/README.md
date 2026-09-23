# Form redesign review

A colorful consistency dashboard with actual workout details behind every calendar day. Main and supplemental work is grouped by exercise; explicit circuit workouts present each movement equally. Watch stats and a Hall of Fame make each day's effort and all-time records easy to inspect.

## Current preview and proof

All artifacts contain **synthetic workouts only**. Current dashboard, workout-detail, and Hall of Fame proof uses source commit `2f38af3` on `cx/playful-workout-redesign`, synchronized with `origin/main` at `8dd2cff`. The following evidence commit changes only this review directory.

- [Desktop overview](desktop-overview.png) and [full desktop dashboard](desktop.png)
- [Phone overview](mobile-overview.png) and [full phone dashboard](mobile.png)
- [Main and supplemental work: desktop](strength-1440.png) / [phone](strength-390.png)
- [Circuit: desktop](circuit-1440.png) / [phone](circuit-390.png)
- [Watch stats: desktop](watch-1440.png) / [phone](watch-390.png)
- [Hall of Fame: desktop](hall-of-fame-1440.png) / [phone](hall-of-fame-390.png)
- [Workout details and records recording](workout-details-and-records.mp4)

Run `npm run build` and `node scripts/preview.cjs`, then open <http://localhost:4182>. No account needed. The local preview substitutes synthetic data, rejects writes, and never reads Sheets. The three most recent occupied calendar days demonstrate main/supplemental work, a circuit, and a watch-recorded run.

Other states: `?state=empty`, `?state=signed-out`, `?state=restricted`, `?state=setup`, `?state=error`. Add `?delay=1` to inspect refreshing. Authentication submission is tested against the normal application with an isolated local database, not through this read-only preview.

## Validation

- Type checking, ESLint, targeted Prettier checks, production build, and diff checks passed.
- All 36 unit/component tests passed, including existing access-control and strength-data tests. New coverage checks workout grouping, equal circuit treatment, hidden RIR/rep-quality labels, watch fields, missing values, secure source links, same-load records, equipment/unit isolation, bodyweight, duplicate sets, and daily totals across multiple sessions.
- Both Cypress smoke tests passed: signup, logout, login, restricted access, and notes. Route and heading assertions guard against interacting with the previous screen during navigation.
- Browser checks passed for shared ranges, keyboard calendar selection, modal focus/Escape/close/return, bodyweight progression, history expansion/filter/pagination, refresh/retry, connection states, and reduced motion.
- Updated strength, circuit, watch, and Hall of Fame interactions passed at 320, 390, 768, and 1440 pixels. Overall range/layout checks also passed at 1024 pixels. No horizontal page or dialog overflow; chart areas scroll inside their panels.
- Touch opening/closing and exercise/weight selection passed. Hall of Fame values stay unchanged when switching overview ranges.
- Axe WCAG 2 A/AA and 2.1 AA scans reported zero violations for the updated overview, records, and open strength/circuit/watch dialogs on desktop and phone. Earlier login, signup, empty/error/access scans passed. Automated scans do not establish complete accessibility certification.

## Data behavior

Sessions and training days count distinct IDs and dates. Weeks start Monday in Eastern Time and the current week is partial. Missing cardio durations stay unknown and incomplete totals are labeled.

Main/supplemental grouping uses existing session focus, set type, and category fields. Explicit circuit labels in Workout, Focus, or Main Lift Focus present all exercises equally. Unclassified sessions use a neutral Exercises group. RIR and rep-quality metadata remain in the source but are hidden in the interface; eligibility rules still exclude failed sets from progression and derived records.

Historical lift records come directly from Rep PRs and are never overwritten by recent workouts. Logged rep bests compare exercise key, equipment, load type, unit, and actual weight. Daily totals combine eligible working sets across sessions on the same recorded date and count duplicate set IDs once. Bodyweight records use reps without invented weight. Training maxes remain separate programming values.

Cardio details read existing watch-stat columns. Session or cardio notes may hold an HTTPS link to an original photo/video, which opens at its current host using its existing access permissions. No media uploads, automatic extraction, or chat-attachment ingestion are implemented. No spreadsheet, database-schema, API, or production-configuration changes are included.

## Earlier review artifacts

The [phone login](login.png) and [initial overview recording](interaction.mp4) came from `f74f980`. The [first calendar drilldown recording](calendar-details.mp4), [desktop](calendar-details-desktop.png), and [phone](calendar-details-mobile.png) came from `bc6963b` and show the earlier detail layout. [Before drilldown](calendar-before.png) preserves the count-only interaction for comparison.
