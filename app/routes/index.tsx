import { dashboardData } from "../workouts/dashboard.server";
import type {
  HeadersFunction,
  LinksFunction,
  LoaderArgs,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useRevalidator } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "../session.server";
import { configured, readWorkbook } from "../workouts/sheets.server";
import { dateKey, exerciseId, number, progress } from "~/workouts/data";
import type { Row } from "~/workouts/data";
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

function value(v: string | undefined) {
  return v === "" || v == null ? "—" : v;
}
function loadLabel(r: Row) {
  return r["Load Type"] === "bodyweight"
    ? "BW"
    : `${value(r["Actual Weight"])} ${r["Weight Unit"] || ""}`;
}
function rir(r: Row) {
  const a = r["RIR Min"],
    b = r["RIR Max"];
  return a && b && a !== b ? `${a}–${b}` : a || b || "—";
}
export default function Index() {
  const { state, error, data, synced, sheetUrl, signedIn } =
    useLoaderData<typeof loader>();
  const refresh = useRevalidator();
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("All");
  const exercises = data
    ? [...new Map(data.sets.map((r) => [exerciseId(r), r])).entries()]
    : [];
  const exercise = exercises.some(([id]) => id === selected)
    ? selected
    : exercises[0]?.[0] || "";
  const points = data ? progress(data.sets, exercise) : [];
  const sessions = data
    ? [...data.sessions].sort((a, b) =>
        dateKey(b.Date).localeCompare(dateKey(a.Date))
      )
    : [];
  const visible = sessions.filter(
    (s) => filter === "All" || s.Workout === filter
  );
  return (
    <main className="tracker">
      <header className="topbar">
        <a className="brand" href="/">
          FORM<span>WORKOUT JOURNAL</span>
        </a>
        <div className="actions">
          {sheetUrl && (
            <a href={sheetUrl} target="_blank" rel="noreferrer">
              Open spreadsheet ↗
            </a>
          )}
          {signedIn && (
            <Form method="post" action="/logout">
              <button>Log out</button>
            </Form>
          )}
        </div>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">YOUR WORK. IN PERSPECTIVE.</p>
          <h1>Keep showing up.</h1>
          <p>Your workouts, your progress. All in one place.</p>
        </div>
        {state === "ready" && (
          <div className="sync">
            <button
              className="primary"
              onClick={() => refresh.revalidate()}
              disabled={refresh.state !== "idle"}
            >
              {refresh.state === "idle" ? "Refresh from sheet" : "Refreshing…"}
            </button>
            <small role="status">
              Read{" "}
              {new Date(synced).toLocaleString("en-US", {
                timeZone: "America/New_York",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              ET
            </small>
          </div>
        )}
      </section>
      {state !== "ready" || !data ? (
        <section className="panel connection">
          <p className="eyebrow">SPREADSHEET → JOURNAL</p>
          <h2>
            {state === "signed-out"
              ? "Your training, at a glance."
              : state === "restricted"
              ? "Private workout journal"
              : state === "setup"
              ? "Ready to connect your spreadsheet"
              : "Connection interrupted"}
          </h2>
          <p>
            {state === "signed-out"
              ? "Sign in to see your workout history and progress. Keep logging in your spreadsheet."
              : state === "restricted"
              ? "This account has not been granted access to the journal."
              : state === "setup"
              ? "The dashboard is ready. Finish the private Google Sheets connection to bring your workouts in."
              : error}
          </p>
          {state === "signed-out" ? (
            <Link className="primary" to="/login">
              Log in
            </Link>
          ) : state === "error" ? (
            <button
              className="primary"
              onClick={() => refresh.revalidate()}
              disabled={refresh.state !== "idle"}
            >
              Try again
            </button>
          ) : null}
        </section>
      ) : (
        <>
          <section className="stats">
            <article>
              <span>Recorded sessions</span>
              <strong>{sessions.length}</strong>
              <small>Across your spreadsheet</small>
            </article>
            <article>
              <span>Latest workout</span>
              <strong>{sessions[0]?.Workout || "—"}</strong>
              <small>{sessions[0]?.Date || "No sessions yet"}</small>
            </article>
            <article>
              <span>Exercises tracked</span>
              <strong>{exercises.length}</strong>
              <small>Kept separate by equipment</small>
            </article>
          </section>
          <div className="dashboard-grid">
            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">THE BIG PICTURE</p>
                  <h2>Exercise progress</h2>
                </div>
              </div>
              <label className="select-label" htmlFor="exercise">
                Exercise & equipment
              </label>
              <select
                id="exercise"
                value={exercise}
                onChange={(e) => setSelected(e.target.value)}
              >
                {exercises.map(([id, r]) => (
                  <option key={id} value={id}>
                    {r.Exercise} · {r.Equipment} · {r["Load Type"]}
                  </option>
                ))}
              </select>
              <p className="muted">
                Heaviest completed working set per session; most reps breaks a
                tie. Warm-ups, calibration, failures and rest-pause sets
                excluded.
              </p>
              {points.length ? (
                <>
                  <div
                    className="chart"
                    role="img"
                    aria-label="Working-set history. Exact weights and reps are listed below."
                  >
                    {points.map((p) => {
                      const amount = p.weight ?? p.reps;
                      const max = Math.max(
                        ...points.map((x) => x.weight ?? x.reps),
                        1
                      );
                      return (
                        <div className="bar-slot" key={p.session}>
                          <span>{amount}</span>
                          <div
                            className="bar"
                            style={{
                              height: `${Math.max(3, (amount / max) * 120)}px`,
                            }}
                          />
                          <small>{p.date.replace(/\/\d{4}$/, "")}</small>
                        </div>
                      );
                    })}
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Weight</th>
                          <th>Reps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {points.map((p) => (
                          <tr key={p.session}>
                            <td>{p.date}</td>
                            <td>
                              {p.weight === null
                                ? "Bodyweight"
                                : `${p.weight} ${
                                    exercises.find(
                                      ([id]) => id === exercise
                                    )?.[1]["Weight Unit"] || ""
                                  }`}
                            </td>
                            <td>{p.reps}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="empty">
                  No comparable working sets recorded yet.
                </p>
              )}
            </section>
            <section className="panel">
              <p className="eyebrow">YOUR PROGRAM</p>
              <h2>Training maxes</h2>
              <p className="muted">
                Programming values, separate from tested and historical bests.
              </p>
              {data.lifts.map((r) => (
                <div className="lift" key={r.Lift}>
                  <span>
                    {r.Lift}
                    <small>
                      Program input {value(r["Program 1RM Input"])} lb
                    </small>
                  </span>
                  <strong>
                    {value(r["Training Max"])}
                    <small>lb TM</small>
                  </strong>
                </div>
              ))}
              <div className="note">
                Keep logging in your spreadsheet. Refresh here to see your
                updates.
              </div>
            </section>
          </div>
          <section className="panel history">
            <div className="section-head">
              <div>
                <p className="eyebrow">SESSION BY SESSION</p>
                <h2>Workout history</h2>
              </div>
              <label>
                Workout{" "}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {["All", ...new Set(sessions.map((s) => s.Workout))].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    )
                  )}
                </select>
              </label>
            </div>
            {!visible.length && (
              <p className="empty">No workouts recorded yet.</p>
            )}
            {visible.map((s) => {
              const sets = data.sets.filter(
                (r) => r["Session ID"] === s["Session ID"]
              );
              const cardio = data.cardio.filter(
                (r) => r["Session ID"] === s["Session ID"]
              );
              return (
                <details className="session" key={s["Session ID"]}>
                  <summary>
                    <span className="session-date">{s.Date}</span>
                    <span>
                      <b>
                        {s.Workout} · {s["Main Lift Focus"] || "Workout"}
                      </b>
                      <small>{s.Focus}</small>
                    </span>
                    <span className="week">
                      {s["Program Week"]
                        ? `Week ${s["Program Week"]}`
                        : "Session"}{" "}
                      ＋
                    </span>
                  </summary>
                  <div className="session-body">
                    <p>{s.Notes}</p>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Exercise / set</th>
                            <th>Planned</th>
                            <th>Actual</th>
                            <th>Reps</th>
                            <th>RIR</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sets.map((r) => (
                            <tr key={r["Set ID"]}>
                              <td>
                                <b>{r.Exercise}</b>
                                <small>
                                  {r.Equipment} · {r["Set Type"]}{" "}
                                  {r["Set Number"]}
                                  {r["Set Part"]}
                                </small>
                              </td>
                              <td>{value(r["Planned Weight"])}</td>
                              <td>{loadLabel(r)}</td>
                              <td>{value(r.Reps)}</td>
                              <td>{rir(r)}</td>
                              <td>
                                {r.Notes || "—"}
                                {r["Rep Quality"] === "failed"
                                  ? " · Failed attempt"
                                  : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {cardio.map((r) => (
                      <div className="note" key={r["Cardio ID"]}>
                        <b>{r.Activity}</b> ·{" "}
                        {number(r["Duration Seconds"]) === null
                          ? "Duration unknown"
                          : `${(Number(r["Duration Seconds"]) / 60).toFixed(
                              1
                            )} min`}{" "}
                        · Incline {value(r.Incline)} · {value(r["Speed MPH"])}{" "}
                        mph<p>{r.Notes}</p>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </section>
          <section className="panel">
            <p className="eyebrow">PERSONAL RECORDS</p>
            <h2>Your bests, preserved.</h2>
            <p className="muted">
              Historical rep records from your spreadsheet. Estimated 1RM is not
              a tested max.
            </p>
            <div className="pr-grid">
              {[...new Set(data.prs.map((r) => r.Lift))].map((lift) => (
                <details key={lift}>
                  <summary>
                    {lift} <span>Rep records ＋</span>
                  </summary>
                  <table>
                    <thead>
                      <tr>
                        <th>Reps</th>
                        <th>Best · lb</th>
                        <th>Est. 1RM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.prs
                        .filter(
                          (r) =>
                            r.Lift === lift &&
                            number(r["Rep Max"]) !== null &&
                            Number(r["Rep Max"]) > 0
                        )
                        .map((r) => (
                          <tr key={r.Reps}>
                            <td>{r.Reps}</td>
                            <td>{r["Rep Max"]}</td>
                            <td>
                              {number(r["Est. 1RM"]) === null
                                ? "—"
                                : Number(r["Est. 1RM"]).toFixed(1)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </details>
              ))}
            </div>
          </section>
        </>
      )}
      <footer>FORM / A little more perspective on the work you put in.</footer>
    </main>
  );
}
