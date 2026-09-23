import { useEffect, useId, useRef, useState } from "react";
import type { progress } from "~/workouts/data";
import { addDays, shortDate } from "~/workouts/overview";
import type { overview, Week } from "~/workouts/overview";

type Overview = ReturnType<typeof overview>;
export function ActivityCalendar({ summary }: { summary: Overview }) {
  const [selected, setSelected] = useState("");
  const date =
    selected >= summary.start && selected <= summary.today
      ? selected
      : summary.today;
  const count = summary.days.get(date) || 0;
  const statusId = useId();
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollLeft = scroll.current.scrollWidth;
  }, [summary.start, summary.today]);
  return (
    <>
      <div
        className="calendar-scroll"
        ref={scroll}
        tabIndex={0}
        role="region"
        aria-label="Workout activity calendar. Scroll horizontally for more weeks."
      >
        <div
          className="calendar"
          style={{
            gridTemplateColumns: `28px repeat(${summary.weeks.length}, minmax(30px, 1fr))`,
          }}
        >
          <div className="calendar-labels" aria-hidden="true">
            <span />
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>
          {summary.weeks.map((week, i) => (
            <div className="calendar-week" key={week.date}>
              <span className="calendar-month" aria-hidden="true">
                {i === 0 ||
                week.date.slice(0, 7) !== summary.weeks[i - 1].date.slice(0, 7)
                  ? shortDate(week.date).split(" ")[0]
                  : ""}
              </span>
              {Array.from({ length: 7 }, (_, j) => {
                const key = addDays(week.date, j),
                  n = summary.days.get(key) || 0,
                  future = key > summary.today;
                return (
                  <button
                    type="button"
                    key={key}
                    className={`calendar-day level-${Math.min(n, 3)}${
                      future ? " future" : ""
                    }${key === summary.today ? " today" : ""}`}
                    disabled={future}
                    aria-label={`${shortDate(key)}, ${key.slice(0, 4)}: ${
                      future
                        ? "Future date"
                        : n
                        ? `${n} session${n === 1 ? "" : "s"}`
                        : "No session recorded"
                    }`}
                    aria-pressed={date === key}
                    aria-describedby={statusId}
                    onClick={() => setSelected(key)}
                  >
                    {n > 0 ? <span>{n}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="calendar-footer">
        <p id={statusId} role="status">
          <b>{shortDate(date)}</b>
          <span>
            {count
              ? `${count} session${count === 1 ? "" : "s"} recorded`
              : "No session recorded"}
          </span>
        </p>
        <div
          className="calendar-key"
          aria-label="Color intensity represents sessions per day"
        >
          Less <i />
          <i />
          <i /> More
        </div>
      </div>
    </>
  );
}
function minutes(value: number) {
  return Number((value / 60).toFixed(1));
}
export function WeeklyChart({
  weeks,
  metric,
}: {
  weeks: Week[];
  metric: "sessions" | "cardio";
}) {
  const isCardio = metric === "cardio";
  const scroll = useRef<HTMLDivElement>(null);
  const start = weeks[0].date;
  useEffect(() => {
    if (scroll.current) scroll.current.scrollLeft = scroll.current.scrollWidth;
  }, [start]);
  const [selected, setSelected] = useState("");
  const active =
    weeks.find((w) => w.date === selected) || weeks[weeks.length - 1];
  const getValue = (w: Week) => (isCardio ? minutes(w.seconds) : w.sessions);
  const max = Math.max(...weeks.map(getValue), 1);
  const describe = (w: Week) =>
    `${shortDate(w.date)}${w.partial ? " (partial week)" : ""}: ${
      isCardio
        ? w.cardioEntries === 0
          ? "No cardio recorded"
          : w.knownDurations === 0
          ? "Duration unknown"
          : `${getValue(w)} recorded minutes`
        : `${w.sessions} sessions`
    }${
      isCardio && w.unknownDurations
        ? `; ${w.unknownDurations} missing duration${
            w.unknownDurations === 1 ? "" : "s"
          }`
        : ""
    }`;
  return (
    <>
      <div
        className={`weekly-chart ${isCardio ? "cardio-bars" : "session-bars"}`}
      >
        <div className="chart-scale" aria-hidden="true">
          <span>{max}</span>
          <span>{Number((max / 2).toFixed(1))}</span>
          <span>0</span>
        </div>
        <div
          className="weekly-scroll"
          ref={scroll}
          tabIndex={0}
          role="region"
          aria-label={`${
            isCardio ? "Cardio minutes" : "Sessions"
          } by week. Scroll horizontally for more weeks.`}
        >
          <div
            className="weekly-bars"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, minmax(28px, 1fr))`,
            }}
          >
            {weeks.map((w, i) => (
              <button
                type="button"
                key={w.date}
                className={`week-column${w.partial ? " partial" : ""}`}
                aria-label={describe(w)}
                aria-pressed={active.date === w.date}
                onClick={() => setSelected(w.date)}
              >
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ height: `${(getValue(w) / max) * 100}%` }}
                  />
                  {isCardio && w.unknownDurations > 0 && (
                    <span className="missing-marker" aria-hidden="true">
                      ?
                    </span>
                  )}
                </span>
                <span className="bar-date" aria-hidden="true">
                  {i === 0 ||
                  i === weeks.length - 1 ||
                  i % Math.max(1, Math.floor(weeks.length / 4)) === 0
                    ? shortDate(w.date)
                    : "·"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="chart-readout" role="status">
        {describe(active)}
      </p>
      <details className="chart-data">
        <summary>View weekly data</summary>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">
              {isCardio ? "Recorded cardio minutes" : "Recorded sessions"} by
              week
            </caption>
            <thead>
              <tr>
                <th>Week of</th>
                <th>{isCardio ? "Minutes" : "Sessions"}</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.date}>
                  <td>
                    {shortDate(w.date)}, {w.date.slice(0, 4)}
                  </td>
                  <td>
                    {isCardio && w.knownDurations === 0
                      ? w.cardioEntries
                        ? "Unknown"
                        : "No cardio recorded"
                      : getValue(w)}
                  </td>
                  <td>
                    {w.partial ? "Partial week" : ""}
                    {isCardio && w.unknownDurations
                      ? ` ${w.unknownDurations} missing duration(s)`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
export function StrengthChart({
  points,
  unit,
  bodyweight,
}: {
  points: ReturnType<typeof progress>;
  unit: string;
  bodyweight: boolean;
}) {
  const [selected, setSelected] = useState("");
  const id = useId().replace(/:/g, "");
  if (!points.length)
    return (
      <p className="empty">
        No comparable working sets in this period. Try a longer range or another
        exercise.
      </p>
    );
  const value = (p: (typeof points)[number]) =>
    bodyweight ? p.reps : p.weight ?? 0;
  const max = Math.max(...points.map(value), 1);
  const x = (i: number) =>
    points.length === 1 ? 320 : 55 + (i / (points.length - 1)) * 550;
  const y = (p: (typeof points)[number]) => 190 - (value(p) / max) * 145;
  const path = points
    .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p)}`)
    .join(" ");
  const active =
    points.find((p) => p.session === selected) || points[points.length - 1];
  const describe = (p: (typeof points)[number]) =>
    `${p.date}: ${bodyweight ? "Bodyweight" : `${p.weight} ${unit}`} · ${
      p.reps
    } reps`;
  return (
    <>
      <div
        className="strength-plot"
        tabIndex={0}
        role="region"
        aria-label="Strength chart. Scroll horizontally to inspect the full chart."
      >
        <svg viewBox="0 0 640 225" role="img" aria-labelledby={`${id}-title`}>
          <title id={`${id}-title`}>
            {`Working-set ${
              bodyweight ? "reps" : `weight in ${unit}`
            }. Exact values and reps are available in the controls and table below.`}
          </title>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7845ec" stopOpacity=".25" />
              <stop offset="100%" stopColor="#7845ec" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line
                x1="55"
                x2="605"
                y1={190 - v * 145}
                y2={190 - v * 145}
                stroke="#e9e2f3"
                strokeDasharray="4 5"
              />
              <text x="42" y={195 - v * 145} textAnchor="end">
                {Number((v * max).toFixed(1))}
              </text>
            </g>
          ))}
          {points.length > 1 && (
            <>
              <path d={`${path} L605,190 L55,190 Z`} fill={`url(#${id})`} />
              <path
                d={path}
                fill="none"
                stroke="#7141d9"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </>
          )}
          {points.map((p, i) => (
            <circle
              key={p.session}
              cx={x(i)}
              cy={y(p)}
              r={active.session === p.session ? 6 : 4}
              fill="#7141d9"
              stroke="white"
              strokeWidth="2"
            />
          ))}
          <text x="55" y="217">
            {points[0].date}
          </text>
          {points.length > 1 && (
            <text x="605" y="217" textAnchor="end">
              {points[points.length - 1].date}
            </text>
          )}
        </svg>
      </div>
      <div className="strength-inspect">
        <label htmlFor={`${id}-set`}>Inspect a session</label>
        <select
          id={`${id}-set`}
          value={active.session}
          onChange={(e) => setSelected(e.target.value)}
        >
          {points.map((p) => (
            <option key={p.session} value={p.session}>
              {describe(p)}
            </option>
          ))}
        </select>
      </div>
      <p className="chart-readout" role="status">
        {describe(active)}
      </p>
      <details className="chart-data">
        <summary>View working sets</summary>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Working-set history</caption>
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
                  <td>{bodyweight ? "Bodyweight" : `${p.weight} ${unit}`}</td>
                  <td>{p.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
