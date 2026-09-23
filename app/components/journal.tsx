import { number } from "~/workouts/data";
import { SessionDetails } from "./session-details";
import { useState } from "react";
import type { Workbook } from "~/workouts/data";
import { uniqueSessions } from "~/workouts/overview";
export function Journal({ data }: { data: Workbook }) {
  const [filter, setFilter] = useState("All");
  const [limit, setLimit] = useState(8);
  const sessions = uniqueSessions(data.sessions);
  const visible = sessions.filter(
    (s) => filter === "All" || s.Workout === filter
  );
  return (
    <section className="panel history" id="history">
      <div className="section-head">
        <div>
          <p className="eyebrow">THE WORK YOU PUT IN</p>
          <h2>
            Your workout journal<span className="heading-dot">.</span>
          </h2>
        </div>
        <label htmlFor="workout-filter">
          Workout{" "}
          <select
            id="workout-filter"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setLimit(8);
            }}
          >
            {["All", ...new Set(sessions.map((s) => s.Workout))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      {!visible.length && <p className="empty">No workouts recorded yet.</p>}
      {visible.slice(0, limit).map((s) => {
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
                {s["Program Week"] ? `Week ${s["Program Week"]}` : "Session"} ＋
              </span>
            </summary>
            <SessionDetails session={s} data={data} />
          </details>
        );
      })}
      {visible.length > 0 && (
        <div className="journal-pagination">
          <span role="status">
            Showing {Math.min(limit, visible.length)} of {visible.length}{" "}
            workouts
          </span>
          {limit < visible.length && (
            <button
              className="refresh-button"
              onClick={() => setLimit(limit + 8)}
            >
              Show more workouts ↓
            </button>
          )}
        </div>
      )}
    </section>
  );
}
export function Records({ data }: { data: Workbook }) {
  return (
    <section className="panel records" id="records">
      <p className="eyebrow">PERSONAL RECORDS</p>
      <h2>
        Personal bests<span className="heading-dot">.</span>
      </h2>
      <p className="muted">
        Historical rep records from your spreadsheet. Estimated 1RM is not a
        tested max.
      </p>
      {!data.prs.length && (
        <p className="empty">
          Your rep records will appear here when they are recorded in your
          sheet.
        </p>
      )}
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
                    (r) => r.Lift === lift && (number(r["Rep Max"]) ?? 0) > 0
                  )
                  .map((r) => (
                    <tr key={r.Reps}>
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
        ))}
      </div>
    </section>
  );
}
