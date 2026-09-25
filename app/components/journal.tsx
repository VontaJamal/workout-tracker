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
    <section className="panel history" id="history" tabIndex={-1}>
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
