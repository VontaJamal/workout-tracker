import { useId, useState } from "react";
import { number } from "~/workouts/data";
import type { Workbook } from "~/workouts/data";
import { recordSets, repBests } from "~/workouts/details";
import { shortDate } from "~/workouts/overview";
const dateLabel = (date: string) => `${shortDate(date)}, ${date.slice(0, 4)}`;
export function Records({ data }: { data: Workbook }) {
  const controlId = useId();
  const sets = recordSets(data);
  const exercises = [...new Map(sets.map((s) => [s.id, s.row])).entries()];
  const [selected, setSelected] = useState("");
  const [load, setLoad] = useState("");
  const id = exercises.some(([id]) => id === selected)
    ? selected
    : exercises[0]?.[0];
  const row = exercises.find(([key]) => key === id)?.[1];
  const weights = [
    ...new Set(sets.filter((s) => s.id === id).map((s) => s.weight)),
  ].sort((a, b) => (b ?? 0) - (a ?? 0));
  const weight = weights.find((w) => String(w) === load) ?? weights[0] ?? null;
  const { bestSet, bestDay } = repBests(sets, id || "", weight);
  const prs = data.prs.filter(
    (r) => (number(r["Rep Max"]) ?? 0) > 0 && (number(r.Reps) ?? 0) > 0
  );
  const lifts = [...new Set(prs.map((r) => r.Lift))];
  return (
    <section className="panel records" id="records" tabIndex={-1}>
      <div className="section-head">
        <div>
          <p className="eyebrow">YOUR NUMBERS TO CHASE</p>
          <h2>
            Hall of Fame<span className="heading-dot">.</span>
          </h2>
        </div>
        <span className="pill coral-pill">All time</span>
      </div>
      <p className="muted">
        Your best work, on the board. These records stay here whichever overview
        range you choose.
      </p>
      <h3 className="record-subheading">Historical lift records</h3>
      {!lifts.length && (
        <p className="empty">
          Your historical lift records will appear here when they are recorded
          in your sheet.
        </p>
      )}
      <div className="record-lifts">
        {lifts.map((lift) => {
          const rows = prs
            .filter((r) => r.Lift === lift)
            .sort((a, b) => (number(a.Reps) ?? 0) - (number(b.Reps) ?? 0));
          const top = [...rows].sort(
            (a, b) =>
              number(b["Rep Max"])! - number(a["Rep Max"])! ||
              number(b.Reps)! - number(a.Reps)!
          )[0];
          return (
            <article className="record-lift" key={lift}>
              <p className="eyebrow">{lift}</p>
              <p className="record-number">
                {top["Rep Max"]}
                <small> lb × {top.Reps} reps</small>
              </p>
              <p className="record-label">Heaviest recorded rep best</p>
              <details>
                <summary>All {lift} rep records</summary>
                <table>
                  <caption className="sr-only">
                    Historical {lift} records
                  </caption>
                  <thead>
                    <tr>
                      <th>Reps</th>
                      <th>Best · lb</th>
                      <th>Est. 1RM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.Reps}</td>
                        <td>{r["Rep Max"]}</td>
                        <td>
                          {number(r["Est. 1RM"]) === null
                            ? "—"
                            : number(r["Est. 1RM"])!.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </article>
          );
        })}
      </div>
      <p className="data-note">
        Historical records come from your Rep PRs sheet. Estimated 1RM is not a
        tested max. Training maxes are separate programming values.
      </p>
      <div className="logged-records">
        <h3 className="record-subheading">Rep bests from your workouts</h3>
        <div className="record-controls">
          <label htmlFor={`${controlId}-exercise`}>
            Exercise & equipment
            <select
              id={`${controlId}-exercise`}
              value={id || ""}
              onChange={(e) => {
                setSelected(e.target.value);
                setLoad("");
              }}
              disabled={!exercises.length}
            >
              {!exercises.length && <option>No recorded working sets</option>}
              {exercises.map(([id, r]) => (
                <option key={id} value={id}>
                  {r.Exercise} · {r.Equipment} ·{" "}
                  {r["Load Type"].replace(/_/g, " ")}
                  {r["Weight Unit"] ? ` · ${r["Weight Unit"]}` : ""}
                </option>
              ))}
            </select>
          </label>
          {!!row && row["Load Type"] !== "bodyweight" && (
            <label htmlFor={`${controlId}-weight`}>
              At this weight
              <select
                id={`${controlId}-weight`}
                value={String(weight)}
                onChange={(e) => setLoad(e.target.value)}
              >
                {weights.map((w) => (
                  <option key={String(w)} value={String(w)}>
                    {w} {row["Weight Unit"]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {bestSet && bestDay ? (
          <div className="rep-best-grid" aria-live="polite">
            <article>
              <p>Most reps in one set</p>
              <strong>
                {bestSet.reps}
                <small> reps</small>
              </strong>
              <span>
                {weight === null
                  ? "Bodyweight"
                  : `${weight} ${row?.["Weight Unit"] || ""}`}{" "}
                · {dateLabel(bestSet.date)}
              </span>
            </article>
            <article>
              <p>Most reps in one day</p>
              <strong>
                {bestDay.reps}
                <small> reps</small>
              </strong>
              <span>
                {bestDay.sets} working {bestDay.sets === 1 ? "set" : "sets"} at{" "}
                {weight === null
                  ? "bodyweight"
                  : `${weight} ${row?.["Weight Unit"] || ""}`}{" "}
                · {dateLabel(bestDay.date)}
              </span>
            </article>
          </div>
        ) : (
          <p className="empty">Log a working set to start your rep records.</p>
        )}
        <p className="data-note">
          Compared at the same weight with the same equipment. Day totals
          include all sessions on that recorded date. Warm-ups, calibration,
          rest-pause, and failed sets are excluded.
        </p>
      </div>
    </section>
  );
}
