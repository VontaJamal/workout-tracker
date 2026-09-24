export type Row = Record<string, string>;
export type Workbook = {
  sessions: Row[];
  sets: Row[];
  cardio: Row[];
  lifts: Row[];
  prs: Row[];
};
export const tables = [
  {
    key: "sessions",
    tab: "Sessions",
    end: "G",
    headers: ["Session ID", "Date", "Workout"],
  },
  {
    key: "sets",
    tab: "Set Log",
    end: "Y",
    headers: [
      "Set ID",
      "Session ID",
      "Date",
      "Actual Weight",
      "Reps",
      "Exercise Key",
      "Equipment",
      "Load Type",
    ],
  },
  {
    key: "cardio",
    tab: "Cardio Log",
    end: "S",
    headers: ["Cardio ID", "Session ID", "Duration Seconds"],
  },
  {
    key: "lifts",
    tab: "Lift Status",
    end: "D",
    headers: ["Lift", "Program 1RM Input", "Training Max"],
  },
  {
    key: "prs",
    tab: "Rep PRs",
    end: "D",
    headers: ["Lift", "Reps", "Rep Max"],
  },
] as const;
export function rows(values: unknown[][], required: readonly string[]): Row[] {
  const headers = (values[0] || []).map(String);
  if (required.some((h) => !headers.includes(h)))
    throw new Error(
      "Spreadsheet columns have changed. Check the required tabs and headers."
    );
  return values
    .slice(1)
    .filter((r) => r.some((v) => v !== "" && v != null))
    .map((r) =>
      Object.fromEntries(
        headers.map((h, i) => [h, r[i] == null ? "" : String(r[i])])
      )
    );
}
export function number(value: string | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const trimmed = value.trim();
  if (
    trimmed.includes(",") &&
    !/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(trimmed)
  )
    return null;
  const n = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
export function trainingMaxes(lifts: Row[]) {
  return lifts
    .filter((r) => {
      const lift = (r.Lift || "").toLowerCase().replace(/[\s_-]/g, "");
      return lift !== "overheadpress" && lift !== "ohp";
    })
    .map((r) => {
      const weight = number(r["Training Max"]);
      return {
        lift: r.Lift,
        weight:
          weight === null || weight < 0 ? null : Math.floor(weight / 5) * 5,
      };
    });
}
export function dateKey(value: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  return m
    ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`
    : value;
}
export function exerciseId(r: Row): string {
  return JSON.stringify([
    r["Exercise Key"],
    r.Equipment,
    r["Load Type"],
    r["Weight Unit"],
  ]);
}
export function progress(sets: Row[], id: string) {
  const grouped = new Map<
    string,
    { date: string; session: string; weight: number | null; reps: number }
  >();
  sets
    .filter(
      (r) =>
        exerciseId(r) === id &&
        !["warmup", "calibration", "rest_pause"].includes(r["Set Type"]) &&
        r["Rep Quality"] !== "failed"
    )
    .forEach((r) => {
      const reps = number(r.Reps),
        weight = number(r["Actual Weight"]);
      if (
        reps === null ||
        reps <= 0 ||
        (weight === null && r["Load Type"] !== "bodyweight")
      )
        return;
      const key = r["Session ID"],
        previous = grouped.get(key);
      if (
        !previous ||
        (weight ?? 0) > (previous.weight ?? 0) ||
        (weight === previous.weight && reps > previous.reps)
      )
        grouped.set(key, { date: r.Date, session: key, weight, reps });
    });
  return [...grouped.values()].sort((a, b) =>
    dateKey(a.date).localeCompare(dateKey(b.date))
  );
}
