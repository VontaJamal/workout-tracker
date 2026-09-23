import type {
  HeadersFunction,
  LinksFunction,
  LoaderArgs,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useRevalidator } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/session.server";
import { dashboardData } from "~/workouts/dashboard.server";
import { configured, readWorkbook } from "~/workouts/sheets.server";
import { exerciseId, progress } from "~/workouts/data";
import {
  calendarDate,
  easternDate,
  overview,
  shortDate,
} from "~/workouts/overview";
import type { WeekRange } from "~/workouts/overview";
import { Brand, Spark } from "~/components/brand";
import {
  ActivityCalendar,
  WeeklyChart,
  StrengthChart,
} from "~/components/charts";
import { Journal, Records } from "~/components/journal";
import styles from "~/styles/workouts.css";
export const headers: HeadersFunction = () => ({
  "Cache-Control": "private, no-store",
});
export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];
export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  return json(
    await dashboardData(user?.id, {
      ownerId: process.env.WORKOUT_OWNER_USER_ID,
      sheetId: process.env.GOOGLE_SHEETS_ID,
      configured: configured(),
      read: readWorkbook,
    }),
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export default function Index() {
  const { state, error, data, synced, sheetUrl, signedIn } =
    useLoaderData<typeof loader>();
  const refresh = useRevalidator();
  const [range, setRange] = useState<WeekRange>(12);
  const [selected, setSelected] = useState("");
  const ready = state === "ready" && data;
  const summary = ready ? overview(data, range, easternDate(synced)) : null;
  const exercises = data
    ? [...new Map(data.sets.map((r) => [exerciseId(r), r])).entries()]
    : [];
  const exercise = exercises.some(([id]) => id === selected)
    ? selected
    : exercises[0]?.[0] || "";
  const exerciseRow = exercises.find(([id]) => id === exercise)?.[1];
  const points =
    data && summary
      ? progress(data.sets, exercise).filter((p) => {
          const date = calendarDate(p.date);
          return date && date >= summary.start && date <= summary.today;
        })
      : [];
  const busy = refresh.state !== "idle";
  return (
    <div className="tracker">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <Brand />
        {ready && (
          <nav aria-label="Main navigation">
            <a href="#overview">Overview</a>
            <a href="#history">Journal</a>
            <a href="#records">Records</a>
          </nav>
        )}
        <div className="actions">
          {sheetUrl && (
            <a
              className="sheet-link"
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open spreadsheet <span aria-hidden="true">↗</span>
            </a>
          )}
          {signedIn && (
            <Form method="post" action="/logout">
              <button className="text-button">Log out</button>
            </Form>
          )}
        </div>
      </header>
      <main id="main">
        {ready && summary ? (
          <>
            <section className="intro" id="overview">
              <div>
                <p className="eyebrow">YOUR TRAINING, IN FULL COLOR</p>
                <h1>
                  Find your rhythm<span className="heading-dot">.</span>
                </h1>
                <p>A little perspective on the work you put in.</p>
              </div>
              <div className="sync">
                <button
                  className="refresh-button"
                  onClick={() => refresh.revalidate()}
                  disabled={busy}
                >
                  <span
                    className={busy ? "refresh-icon spinning" : "refresh-icon"}
                    aria-hidden="true"
                  >
                    ↻
                  </span>
                  {busy ? "Refreshing…" : "Refresh from sheet"}
                </button>
                <small role="status">
                  {busy
                    ? "Reading your latest workouts…"
                    : `Updated ${new Date(synced).toLocaleString("en-US", {
                        timeZone: "America/New_York",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })} ET`}
                </small>
              </div>
            </section>
            <div className="overview-toolbar">
              <p>
                <span className="status-dot" />
                {shortDate(summary.start)} to {shortDate(summary.today)},{" "}
                {summary.today.slice(0, 4)}
              </p>
              <div
                className="range-switch"
                role="group"
                aria-label="Overview date range"
              >
                {([4, 12, 26] as const).map((weeks) => (
                  <button
                    key={weeks}
                    aria-pressed={range === weeks}
                    onClick={() => setRange(weeks)}
                  >
                    {weeks} weeks
                  </button>
                ))}
              </div>
            </div>
            <div className="hero-grid" aria-busy={busy}>
              <section className="rhythm-card">
                <div className="card-topline">
                  <span>SHOWING UP</span>
                  <Spark />
                </div>
                <div className="hero-number">
                  {summary.trainingDays}
                  <span>training days</span>
                </div>
                <p className="hero-message">
                  {summary.trainingDays
                    ? "You made time for movement."
                    : "Your next session starts the story."}
                </p>
                <div className="hero-bottom">
                  <div>
                    <strong>{summary.sessionCount}</strong>
                    <span>recorded sessions</span>
                  </div>
                  <div>
                    <strong>{range}</strong>
                    <span>weeks in view</span>
                  </div>
                </div>
                <span className="hero-orbit" aria-hidden="true" />
              </section>
              <section className="panel activity-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">ONE DAY AT A TIME</p>
                    <h2>Your activity</h2>
                  </div>
                  <span className="pill coral-pill">
                    {summary.trainingDays} active days
                  </span>
                </div>
                <p className="muted">
                  Each tile is a day. Pick one to see your sessions.
                </p>
                <ActivityCalendar summary={summary} />
                {summary.undatedSessions > 0 && (
                  <p className="data-note">
                    {summary.undatedSessions} session(s) have an unreadable date
                    and are only shown in your journal.
                  </p>
                )}
              </section>
            </div>
            <div className="latest-strip">
              <span className="latest-icon" aria-hidden="true">
                ↗
              </span>
              <span>
                <small>LATEST WORKOUT</small>
                <b>
                  {summary.latest
                    ? `${summary.latest.Workout}${
                        summary.latest["Main Lift Focus"]
                          ? ` · ${summary.latest["Main Lift Focus"]}`
                          : ""
                      }`
                    : "Your journal is ready"}
                </b>
              </span>
              <span className="latest-date">
                {summary.latest
                  ? shortDate(calendarDate(summary.latest.Date)!)
                  : "No sessions recorded yet"}
              </span>
              <a href="#history">
                View journal <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="chart-grid" aria-busy={busy}>
              <section className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">BUILD YOUR ROUTINE</p>
                    <h2>Week by week</h2>
                  </div>
                  <span className="chart-icon violet-icon" aria-hidden="true">
                    ▥
                  </span>
                </div>
                <div className="chart-stat">
                  <strong>{summary.sessionCount}</strong>
                  <span>sessions recorded</span>
                </div>
                <WeeklyChart weeks={summary.weeks} metric="sessions" />
                <p className="data-note">
                  Weeks start Monday. The current week is partial.
                </p>
              </section>
              <section className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">KEEP MOVING</p>
                    <h2>Cardio time</h2>
                  </div>
                  <span className="chart-icon orange-icon" aria-hidden="true">
                    ↗
                  </span>
                </div>
                <div className="chart-stat">
                  <strong>
                    {summary.knownDurations
                      ? Number((summary.seconds / 60).toFixed(1))
                      : "—"}
                  </strong>
                  <span>
                    {summary.unknownDurations
                      ? "known minutes · incomplete total"
                      : "recorded minutes"}
                  </span>
                </div>
                <WeeklyChart weeks={summary.weeks} metric="cardio" />
                <p className="data-note">
                  {summary.unknownDurations
                    ? `${summary.unknownDurations} cardio entry(s) have no usable duration. `
                    : ""}
                  {summary.undatedCardio
                    ? `${summary.undatedCardio} cardio entry(s) could not be placed on a date. `
                    : ""}
                  Minutes come from your recorded durations.
                </p>
              </section>
            </div>
            <div className="strength-grid">
              <section className="panel strength-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">SEE YOUR WORK ADD UP</p>
                    <h2>Strength progress</h2>
                  </div>
                  <span className="pill violet-pill">{range} weeks</span>
                </div>
                <label className="select-label" htmlFor="exercise">
                  Exercise & equipment
                </label>
                <select
                  id="exercise"
                  value={exercise}
                  onChange={(e) => setSelected(e.target.value)}
                  disabled={!exercises.length}
                >
                  {!exercises.length && (
                    <option value="">No exercises recorded</option>
                  )}
                  {exercises.map(([id, r]) => (
                    <option key={id} value={id}>
                      {r.Exercise} · {r.Equipment} · {r["Load Type"]}
                      {r["Weight Unit"] ? ` · ${r["Weight Unit"]}` : ""}
                    </option>
                  ))}
                </select>
                <StrengthChart
                  key={exercise}
                  points={points}
                  unit={exerciseRow?.["Weight Unit"] || ""}
                  bodyweight={exerciseRow?.["Load Type"] === "bodyweight"}
                />
                <p className="data-note">
                  Heaviest eligible working set per session; reps break ties.
                  Warm-ups, calibration, failed and rest-pause sets excluded.
                  Bodyweight shows reps.
                </p>
              </section>
              <section className="program-card">
                <div className="card-topline">
                  <span>YOUR PROGRAM</span>
                  <Spark />
                </div>
                <h2>Training maxes</h2>
                <p>Current programming values from your sheet.</p>
                <div className="training-lifts">
                  {data.lifts.map((r) => (
                    <div className="lift" key={r.Lift}>
                      <span>
                        {r.Lift}
                        <small>
                          Program input {r["Program 1RM Input"] || "—"} lb
                        </small>
                      </span>
                      <strong>
                        {r["Training Max"] || "—"}
                        <small>lb TM</small>
                      </strong>
                    </div>
                  ))}
                </div>
                {!data.lifts.length && <p>No training maxes recorded yet.</p>}
                <p className="program-footnote">
                  Programming values are separate from tested and historical
                  bests.
                </p>
              </section>
            </div>
            <Journal data={data} />
            <Records data={data} />
          </>
        ) : (
          <section className="connection-layout">
            <div className="welcome-art">
              <p className="eyebrow">MEET YOUR WORKOUT JOURNAL</p>
              <h1>
                Make your
                <br />
                effort visible<span>.</span>
              </h1>
              <p>
                See when you showed up, what you lifted, and how your training
                adds up.
              </p>
              <Spark className="welcome-spark" />
              <div className="decorative-track" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="connection">
              <p className="eyebrow">YOUR SPACE TO TRAIN</p>
              <h2>
                {state === "signed-out"
                  ? "Welcome to Form."
                  : state === "restricted"
                  ? "Private workout journal"
                  : state === "setup"
                  ? "Connect your spreadsheet"
                  : "Connection interrupted"}
              </h2>
              <p>
                {state === "signed-out"
                  ? "Sign in to see your training. Keep logging in your spreadsheet."
                  : state === "restricted"
                  ? "This account has not been granted access to the journal."
                  : state === "setup"
                  ? "Finish the private Google Sheets connection to see your workouts here."
                  : error}
              </p>
              {state === "signed-out" ? (
                <Link className="primary" to="/login">
                  Log in <span aria-hidden="true">↗</span>
                </Link>
              ) : state === "error" ? (
                <button
                  className="primary"
                  onClick={() => refresh.revalidate()}
                  disabled={busy}
                >
                  {busy ? "Retrying…" : "Try again"}
                </button>
              ) : null}
              {busy && <p role="status">Reading your workouts…</p>}
            </div>
          </section>
        )}
      </main>
      <footer>
        <Brand />
        <p>Keep logging in your sheet. See the bigger picture here.</p>
        <span>YOUR PACE. YOUR PROGRESS.</span>
      </footer>
    </div>
  );
}
