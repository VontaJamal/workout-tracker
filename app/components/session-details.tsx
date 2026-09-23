import { number } from "~/workouts/data";
import type { Row, Workbook } from "~/workouts/data";
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
      {session.Notes && <p>{session.Notes}</p>}
      {sets.length > 0 && (
        <div
          className="table-wrap"
          tabIndex={0}
          role="region"
          aria-label={`Sets for ${session.Workout || "this workout"}`}
        >
          <table>
            <caption className="sr-only">
              Sets for {session.Workout || "this workout"}
            </caption>
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
                  <td data-label="Exercise / set">
                    <b>{r.Exercise}</b>
                    <small>
                      {r.Equipment} · {r["Set Type"]} {r["Set Number"]}
                      {r["Set Part"]}
                    </small>
                  </td>
                  <td data-label="Planned">{value(r["Planned Weight"])}</td>
                  <td data-label="Actual">{loadLabel(r)}</td>
                  <td data-label="Reps">{value(r.Reps)}</td>
                  <td data-label="RIR">{rir(r)}</td>
                  <td data-label="Notes">
                    {r.Notes || "—"}
                    {r["Rep Quality"] === "failed"
                      ? " · Failed attempt"
                      : r["Rep Quality"]
                      ? ` · Rep quality: ${r["Rep Quality"]}`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!sets.length && !cardio.length && (
        <p>No set or cardio details recorded for this workout.</p>
      )}
      {cardio.map((r) => (
        <div className="note" key={r["Cardio ID"]}>
          <b>{r.Activity}</b> ·{" "}
          {number(r["Duration Seconds"]) === null ||
          number(r["Duration Seconds"])! < 0
            ? "Duration unknown"
            : `${(number(r["Duration Seconds"])! / 60).toFixed(1)} min`}{" "}
          · Incline {value(r.Incline)} · {value(r["Speed MPH"])} mph
          <p>{r.Notes}</p>
        </div>
      ))}
    </div>
  );
}
