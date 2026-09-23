# Form redesign review

A consistency-first dashboard with a violet, coral, and orange palette. The activity calendar leads on phones; the desktop overview pairs it with a training summary. Weekly sessions, cardio minutes, and exercise progress share a 4 / 12 / 26 week range. Workout history remains independent of that range. Selecting a calendar day opens every workout recorded on that date, with exercises, sets, weights, reps, notes, and cardio details.

## Preview and evidence

These artifacts contain **synthetic workouts only** on `cx/playful-workout-redesign`. The original overview proof was captured from source commit `f74f980`; the calendar workout-details proof was captured from `bc6963b`. Both were synchronized with `origin/main` at `8dd2cff`. The following evidence commits change only this review directory.

- [Desktop overview](desktop-overview.png) and [full desktop dashboard](desktop.png)
- [Phone overview](mobile-overview.png) and [full phone dashboard](mobile.png)
- [Phone login](login.png)
- [Overview interaction recording](interaction.mp4)
- [Calendar workout details on desktop](calendar-details-desktop.png) and [phone](calendar-details-mobile.png)
- [Calendar workout-details recording](calendar-details.mp4)
- [Before: calendar selection only repeated the count](calendar-before.png)

Run `npm run build` and `node scripts/preview.cjs`, then open <http://localhost:4182>. The preview needs no account and uses no private spreadsheet data. It binds to localhost and rejects writes. Its loader substitutes exist only in the standalone preview process.

Other states: `?state=empty`, `?state=signed-out`, `?state=restricted`, `?state=setup`, `?state=error`. Add `?delay=1` to inspect refreshing. Authentication submission is tested against the normal application with an isolated local test database, not through this read-only preview.

## Validation

- Type checking, ESLint, targeted Prettier checks, production build, and diff whitespace checks passed.
- All 27 unit/component tests passed, including the existing data and access-control tests.
- Both Cypress smoke tests passed: signup, logout, login, restricted dashboard access, and existing notes behavior. Route assertions prevent querying the previous form during navigation.
- Headless browser checks passed for shared ranges, keyboard calendar selection, bodyweight progression, history expansion/filter/pagination, records, refresh and retry, empty/access/error states, and reduced motion. No browser errors were observed.
- No page overflow at widths 320, 390, 768, 1024, and 1440 with all three date ranges. Calendar and chart areas scroll within their panels.
- Calendar drilldown regression tests first failed against the prior count-only interaction, then passed. They cover multiple sessions on one date, normalized dates, all sets and notes, unknown cardio duration, empty days, closing, and the StrictMode dialog lifecycle.
- Calendar workout details passed browser checks for keyboard opening, modal focus containment, Escape, Close, focus return, body scroll restoration, empty days, and range changes at 320, 390, 768, and 1440 pixels. Dialogs had no horizontal overflow.
- Touch selection and range switching passed in a phone browser context. Touch opening and closing the workout details also passed.
- Axe WCAG 2 A/AA and 2.1 AA checks reported zero violations for ready, empty, error, signed-out, login, and signup screens at 390 and 1440 pixels. The open workout-details dialog also reported zero violations at desktop and phone widths. This automated scan is not a claim of complete accessibility certification.

## Data behavior

Counts use distinct session IDs and dates. Weeks start Monday and the current week is partial. Unknown durations stay unknown; partial cardio totals and unplaceable dates are labeled. Existing exercise/equipment/unit grouping and strength eligibility rules remain in force. No schema, spreadsheet, credential, or production configuration changes are part of this redesign.
