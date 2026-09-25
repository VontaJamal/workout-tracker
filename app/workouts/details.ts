import { exerciseId, number } from "./data";
import type { Row, Workbook } from "./data";
import { calendarDate, uniqueSessions } from "./overview";

export function isWorkingSet(row: Row) {
  return (
    !["warmup", "calibration", "rest_pause"].includes(row["Set Type"]) &&
    row["Rep Quality"] !== "failed"
  );
}
export function workoutGroups(session: Row, sets: Row[]) {
  const circuit = /\bcircuit\b/i.test(
    [session.Workout, session.Focus, session["Main Lift Focus"]].join(" ")
  );
  const main = (r: Row) =>
    r["Set Type"] === "main" ||
    r.Category === "Main Lift" ||
    (!!session["Main Lift Focus"] &&
      r.Exercise?.toLowerCase() === session["Main Lift Focus"].toLowerCase());
  const hasMain = sets.some(main);
  const sections = new Map<string, Row[]>();
  for (const row of sets) {
    const supporting = ["supplemental", "assistance"].includes(row["Set Type"]);
    const section = circuit
      ? "Circuit"
      : supporting
      ? "Supplemental work"
      : main(row)
      ? "Main workout"
      : hasMain
      ? "Supplemental work"
      : "Exercises";
    sections.set(section, [...(sections.get(section) || []), row]);
  }
  return [...sections]
    .sort(([a], [b]) =>
      a === "Main workout" ? -1 : b === "Main workout" ? 1 : 0
    )
    .map(([label, rows]) => {
      const exercises = new Map<string, Row[]>();
      rows.forEach((row) => {
        const id = exerciseId(row);
        exercises.set(id, [...(exercises.get(id) || []), row]);
      });
      return {
        label,
        exercises: [...exercises].map(([id, sets]) => ({
          id,
          sets,
          row: sets[0],
        })),
      };
    });
}
export function recordSets(data: Workbook) {
  const dates = new Map(
    uniqueSessions(data.sessions).map((s) => [
      s["Session ID"],
      calendarDate(s.Date),
    ])
  );
  const seen = new Set<string>();
  return data.sets.flatMap((row) => {
    const id = row["Set ID"];
    if (id && seen.has(id)) return [];
    if (id) seen.add(id);
    const reps = number(row.Reps);
    const bodyweight = row["Load Type"] === "bodyweight";
    const weight = bodyweight ? null : number(row["Actual Weight"]);
    const date = dates.get(row["Session ID"]) || calendarDate(row.Date);
    if (
      !isWorkingSet(row) ||
      !date ||
      reps === null ||
      reps <= 0 ||
      !Number.isInteger(reps) ||
      (!bodyweight && (weight === null || weight < 0))
    )
      return [];
    return [{ row, date, reps, weight, id: exerciseId(row) }];
  });
}
export function repBests(
  sets: ReturnType<typeof recordSets>,
  id: string,
  weight: number | null
) {
  const matches = sets.filter((s) => s.id === id && s.weight === weight);
  const days = new Map<string, { date: string; reps: number; sets: number }>();
  matches.forEach((set) => {
    const day = days.get(set.date) || { date: set.date, reps: 0, sets: 0 };
    day.reps += set.reps;
    day.sets++;
    days.set(set.date, day);
  });
  return {
    bestSet: [...matches].sort(
      (a, b) => b.reps - a.reps || a.date.localeCompare(b.date)
    )[0],
    bestDay: [...days.values()].sort(
      (a, b) => b.reps - a.reps || a.date.localeCompare(b.date)
    )[0],
  };
}
// Source media remains private at its original host; never auto-fetch or embed it.
export function sourceLinks(notes: string | undefined) {
  return [...new Set((notes || "").match(/https:\/\/[^\s<>]+/g) || [])].flatMap(
    (raw) => {
      try {
        const url = new URL(raw.replace(/[.,;)]+$/, ""));
        return url.protocol === "https:" && !url.username && !url.password
          ? [url.href]
          : [];
      } catch {
        return [];
      }
    }
  );
}
