import { number } from "~/workouts/data";
import type { Row, Workbook } from "~/workouts/data";
import { sourceLinks, workoutGroups } from "~/workouts/details";
function value(v: string | undefined) {
  return v === "" || v == null ? "—" : v;
}
function loadLabel(r: Row) {
  return r["Load Type"] === "bodyweight"
    ? "Bodyweight"
    : `${value(r["Actual Weight"])} ${r["Weight Unit"] || ""}`;
}
function Notes({ text }: { text?: string }) {
  const links = sourceLinks(text);
  return (
    <>
      {text && <p className="workout-notes">{text}</p>}
      {links.length > 0 && (
        <div className="source-links">
          {links.map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              Open source link
              {links.length > 1 ? ` ${index + 1}` : ""} ↗
            </a>
          ))}
        </div>
      )}
    </>
  );
}
export function SessionDetails({
  session,
  data,
}: {
  session: Row;
  data: Workbook;
}) {
  const sets = data.sets.filter(
    (r) => r["Session ID"] === session["Session ID"]
  );
  const cardio = data.cardio.filter(
    (r) => r["Session ID"] === session["Session ID"]
  );
  return (
    <div className="session-body">
      <Notes text={session.Notes} />
      {workoutGroups(session, sets).map((group) => (
        <section
          className={`workout-group ${
            group.label === "Circuit" ? "circuit-group" : ""
          }`}
          key={group.label}
          aria-label={group.label}
        >
          <div className="workout-group-title">
            <h4>{group.label}</h4>
            <span>
              {group.exercises.length}{" "}
              {group.exercises.length === 1 ? "exercise" : "exercises"}
            </span>
          </div>
          <div className="exercise-cards">
            {group.exercises.map(({ id, row, sets }) => (
              <article className="exercise-card" key={id}>
                <header>
                  <h5>{row.Exercise || "Exercise"}</h5>
                  <span>{row.Equipment}</span>
                </header>
                <div
                  className="table-wrap"
                  tabIndex={0}
                  role="region"
                  aria-label={`Sets for ${row.Exercise || "this exercise"}`}
                >
                  <table>
                    <caption className="sr-only">{row.Exercise} sets</caption>
                    <thead>
                      <tr>
                        <th>Set</th>
                        <th>Weight</th>
                        <th>Reps</th>
                        <th>Planned</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sets.map((r, i) => (
                        <tr key={r["Set ID"] || i}>
                          <td data-label="Set">
                            {r["Set Number"] || i + 1}
                            {r["Set Part"]}
                            <small>{r["Set Type"]?.replace(/_/g, " ")}</small>
                          </td>
                          <td data-label="Weight">{loadLabel(r)}</td>
                          <td data-label="Reps">{value(r.Reps)}</td>
                          <td data-label="Planned">
                            {r["Load Type"] === "bodyweight"
                              ? "—"
                              : `${value(r["Planned Weight"])}${
                                  r["Planned Weight"]
                                    ? ` ${r["Weight Unit"] || ""}`
                                    : ""
                                }`}
                          </td>
                          <td data-label="Notes">{r.Notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {!sets.length && !cardio.length && (
        <p>No set or cardio details recorded for this workout.</p>
      )}
      {cardio.map((r) => (
        <CardioDetails key={r["Cardio ID"]} row={r} />
      ))}
    </div>
  );
}
function CardioDetails({ row: r }: { row: Row }) {
  const seconds = number(r["Duration Seconds"]);
  const fields = [
    ["Calories", "Calories", "kcal"],
    ["Avg HR", "Average heart rate", "bpm"],
    ["Max HR", "Peak heart rate", "bpm"],
    ["Device Distance Miles", "Watch distance", "mi"],
    ["Steps", "Steps", ""],
    ["Zone Minutes", "Zone minutes", "min"],
    ["Speed MPH", "Speed", "mph"],
    ["Incline", "Incline", ""],
  ];
  const source = r["Data Source"]?.replace(/_/g, " ");
  return (
    <section
      className="cardio-detail"
      aria-label={`${r.Activity || "Cardio"} stats`}
    >
      <header>
        <div>
          <p className="eyebrow">CARDIO</p>
          <h4>{r.Activity || "Cardio"}</h4>
        </div>
        <span>{r.Equipment}</span>
      </header>
      <dl className="cardio-stats">
        <div>
          <dt>Duration</dt>
          <dd>
            {seconds === null || seconds < 0
              ? "Unknown"
              : `${(seconds / 60).toFixed(1)} min`}
          </dd>
        </div>
        {fields.map(([key, label, unit]) => {
          const n = number(r[key]);
          return n === null || n < 0 ? null : (
            <div key={key}>
              <dt>{label}</dt>
              <dd>
                {n.toLocaleString("en-US")} <small>{unit}</small>
              </dd>
            </div>
          );
        })}
      </dl>
      {source && <p className="data-note">Recorded source: {source}</p>}
      {r["Distance Source"] && (
        <p className="data-note">Distance source: {r["Distance Source"]}</p>
      )}
      <Notes text={r.Notes} />
    </section>
  );
}
