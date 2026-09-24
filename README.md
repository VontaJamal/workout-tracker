# Workout Tracker / Form

A read-only, responsive workout dashboard built on this repository's Remix app. Continue logging in Google Sheets; refresh the dashboard to see those changes. No workout entry, goal prescriptions, or writes back to the workbook.

## Dashboard

- A colorful consistency overview with an activity calendar, weekly sessions, cardio minutes, and strength trends.
- Select a calendar day to open its workouts, full set details, notes, and cardio. Multiple sessions appear together; mobile set cards keep the numbers readable.
- Shared 4, 12, and 26 week ranges, anchored to the latest sheet read in Eastern Time. Weeks start Monday and the current week is labeled partial.
- Session summaries with expandable individual sets, notes, and cardio. History shows eight workouts at a time; Show more keeps older workouts accessible independently of the chart range.
- Exercise progress grouped by exercise key, equipment, load type, and unit.
- A Hall of Fame above the journal shows historical rep PRs, most reps in one set, and most reps in one recorded day. Rep comparisons separate equipment, load type, unit, and actual weight; duplicate set IDs are counted once. Training maxes remain separate.
- Main and supplemental work is grouped into exercise cards. Sessions explicitly labeled as a circuit in Workout, Focus, or Main Lift Focus show every movement at equal prominence. Unclassified workouts stay neutral.
- Cardio details display recorded duration, calories, average/peak heart rate, steps, zone minutes, device distance, speed, and incline when known. Notes can include an HTTPS link to an original watch photo or video; the link opens at its existing host with its existing access permissions. The app does not upload files, OCR images, or automatically receive chat attachments.
- Section links keep navigation, keyboard focus, and browser back/forward positions consistent.
- Training maxes display base weights rounded down to the nearest 5, with overhead press hidden for now. This display rule does not alter spreadsheet values, workout loads, or historical records. Internal program-input labels and cardio provenance stay out of the interface.
- Signed-out, access-restricted, setup, empty, refresh, and connection-error states.
- Private server-side Sheets reads, restricted to one existing app user ID.

No personal workout data, spreadsheet ID, or Google credentials are committed. The Google Drive connection used in ChatGPT is not an application credential.

## Run locally

Use Node 22 (Node 20 minimum).

```sh
npm install
cp .env.example .env
npm run setup
npm run dev
```

Replace the example SESSION_SECRET with a strong random secret before deployment. `setup` retains the starter's sample user/notes seed; that sample account has **no dashboard access** unless explicitly selected as owner. Never select that sample account for a real workbook.

Create your own account at `/join`. Locate its `id` with `npx prisma studio` and set `WORKOUT_OWNER_USER_ID` to that ID in the server environment. Restart after environment changes. Authorization uses a database ID, not an unverified signup email. Other accounts cannot read the sheet.

## Connect the existing private spreadsheet

1. Enable the Google Sheets API in a Google Cloud project and create a service account.
2. Store its credentials in server environment secrets:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: service account email.
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: PEM private key (literal newlines or escaped `\n`).
   - `GOOGLE_SHEETS_ID`: workbook ID from its URL.
3. Share only that workbook with the service account as **Viewer**. It need not be public or published to the web.
4. Set `WORKOUT_OWNER_USER_ID` as above, restart, log in, and press **Refresh from sheet**.

The app requests only the `spreadsheets.readonly` scope. Tokens stay on the server. Each authorized page load or refresh reads current sheet values; there is no background polling or claim of real-time updates. Read timestamps show America/New_York time. Workbook edits are not copied into the app database.

Expected tabs and column contracts are in `app/workouts/data.ts`: **Sessions**, **Set Log**, **Cardio Log**, **Lift Status**, and **Rep PRs**. Reads include populated rows across these tables, including rows added after initial setup. A missing tab/header produces a connection error rather than fabricated data. This first pass assumes the current workbook's US date strings and lb-based Lift Status/Rep PRs.

## Data rules

- Unknown numbers remain unknown; zero is a real recorded zero. Cardio totals identify missing durations and exclude undated entries with an explanation.
- Consistency counts distinct session IDs and recorded dates; empty days mean no session recorded, not a missed goal. Future dates are excluded from overview totals.
- Actual weight drives progress. Never substitute planned weight.
- Bodyweight sets show reps without invented weight or tonnage.
- Progress shows the heaviest eligible set per session, breaking load ties by reps. It is not an estimated-strength score; rep counts remain visible.
- Warm-up, calibration, failed, and rest-pause sets remain visible in history but are excluded from the progress chart.
- RIR and rep-quality metadata stay in the sheet and are omitted from the interface. Existing eligibility rules still exclude failed sets from progress and derived records.
- Historical PRs come directly from Rep PRs and are never overwritten by recent sessions.
- Program weeks come from each session; a repeated week does not advance automatically.
- Session details show Set, Weight, Reps, and Notes. Weight is the original actual load, independent of current training maxes; planned loads stay in the spreadsheet and are omitted from the interface. Pound weights omit repeated lb labels; other units and bodyweight remain explicit.

## Design preview

Run `npm run build`, then `node scripts/preview.cjs`. Open [the local preview](http://localhost:4182). It binds only to localhost, uses synthetic workouts, rejects writes, and never reads Google Sheets. Use `?state=empty`, `?state=signed-out`, `?state=restricted`, `?state=setup`, or `?state=error` to review other states; `?delay=1` makes the refresh state visible. Production loaders and access checks do not use this preview script.

## Validation

```sh
npm run typecheck
npm run lint
npm run test -- --run --threads=false
npm run build
npm run test:dashboard
```

Unit and component tests cover aggregation, Eastern date boundaries, duplicate sessions, missing durations, range changes, chart selection, journal pagination, blank/zero handling, equipment isolation, excluded set types, bodyweight progression, date ordering, and access control. Existing Cypress coverage preserves signup/login and the starter notes routes. The synthetic dashboard suite checks first and repeated section navigation on desktop and phone, focus, back/forward restoration, query preservation, and simplified cardio/training labels.

## Deployment

The existing Fly/Docker workflow is retained. Node and Remix versions are made reproducible for the existing Remix v1 route structure; dependencies install from the pinned framework version. Main/dev pushes retain the repository's existing automatic deployment behavior. Review and configure server secrets before merging. No deployment is performed by this change. The inherited framework/toolchain is older; upgrading it is separate work from this first dashboard pass.

Google API references: [read values](https://developers.google.com/workspace/sheets/api/guides/values), [batchGet](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet), [service account authorization](https://developers.google.com/identity/protocols/oauth2/service-account).
