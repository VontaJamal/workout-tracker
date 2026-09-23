import { recordSets, repBests, sourceLinks, workoutGroups } from "./details";
import { exerciseId } from "./data";
import type { Row, Workbook } from "./data";
const set = (extra: Row = {}): Row => ({
  "Set ID": "1",
  "Session ID": "a",
  Date: "9/22/2026",
  Exercise: "Squat",
  "Exercise Key": "squat",
  Equipment: "Barbell",
  "Load Type": "barbell_total",
  "Weight Unit": "lb",
  "Set Type": "main",
  "Actual Weight": "100",
  Reps: "5",
  ...extra,
});
const book = (sets: Row[]): Workbook => ({
  sets,
  sessions: [],
  cardio: [],
  lifts: [],
  prs: [],
});
it("groups main and supplemental sets without losing warm-ups, notes, or assistance", () => {
  const source = [
    set({ "Set Type": "warmup" }),
    set(),
    set({ "Set Type": "supplemental" }),
    set({
      Exercise: "Row",
      "Exercise Key": "row",
      "Set Type": "assistance",
      Notes: "Original note",
    }),
  ];
  const groups = workoutGroups({ "Main Lift Focus": "Squat" }, source);
  expect(groups.map((g) => g.label)).toEqual([
    "Main workout",
    "Supplemental work",
  ]);
  expect(groups[0].exercises[0].sets).toHaveLength(2);
  expect(groups[1].exercises).toHaveLength(2);
  expect(groups[1].exercises[1].sets[0].Notes).toBe("Original note");
});
it("presents circuit movements equally and does not infer a circuit from an unclassified workout", () => {
  const sets = [
    set(),
    set({ Exercise: "Row", "Exercise Key": "row", "Set Type": "assistance" }),
  ];
  const groups = workoutGroups({ Workout: "Full body circuit" }, sets);
  expect(groups).toHaveLength(1);
  expect(groups[0].label).toBe("Circuit");
  expect(groups[0].exercises).toHaveLength(2);
  expect(workoutGroups({}, [set({ "Set Type": "working" })])[0].label).toBe(
    "Exercises"
  );
});
it("finds max reps per set and per recorded day across sessions at the same load", () => {
  const a = set();
  const data = book([
    a,
    a,
    set({ "Set ID": "2", "Session ID": "b", Date: "2026-09-22", Reps: "8" }),
    set({ "Set ID": "3", Date: "9/23/2026", Reps: "10" }),
    set({ "Set ID": "4", "Actual Weight": "90", Reps: "20" }),
    set({ "Set ID": "5", Equipment: "Machine", Reps: "30" }),
    set({ "Set ID": "6", "Weight Unit": "kg", Reps: "40" }),
  ]);
  const best = repBests(recordSets(data), exerciseId(a), 100);
  expect(best.bestSet.reps).toBe(10);
  expect(best.bestDay).toEqual({ date: "2026-09-22", reps: 13, sets: 2 });
});
it("preserves eligibility, bodyweight, missing load, unknown quality, and recorded zero rules", () => {
  const source = [
    set({
      "Set ID": "a",
      "Load Type": "bodyweight",
      "Actual Weight": "",
      Reps: "12",
      "Rep Quality": "unknown",
    }),
    ...["warmup", "rest_pause", "calibration"].map((type, i) =>
      set({ "Set ID": String(i), "Set Type": type })
    ),
    set({ "Set ID": "failed", "Rep Quality": "failed" }),
    set({ "Set ID": "missing", "Actual Weight": "", "Planned Weight": "100" }),
    set({ "Set ID": "zero", Reps: "0" }),
    set({ "Set ID": "invalid", Date: "not a date" }),
    set({ "Set ID": "weight-zero", "Actual Weight": "0" }),
  ];
  const records = recordSets(book(source));
  expect(records.map((r) => r.row["Set ID"])).toEqual(["a", "weight-zero"]);
  expect(records[0].weight).toBeNull();
  expect(repBests(records, records[0].id, null).bestSet.reps).toBe(12);
});
it("uses a session's recorded date to keep the calendar and best-day total consistent", () => {
  const data = book([set()]);
  data.sessions = [{ "Session ID": "a", Date: "9/23/2026" }];
  expect(recordSets(data)[0].date).toBe("2026-09-23");
});
it("only turns secure source URLs into links without embedded credentials", () => {
  expect(
    sourceLinks(
      "Photo https://drive.google.com/file/d/example/view. javascript:alert(1) https://name:secret@example.com/photo"
    )
  ).toEqual(["https://drive.google.com/file/d/example/view"]);
  expect(sourceLinks("Photo attached in chat")).toEqual([]);
});
