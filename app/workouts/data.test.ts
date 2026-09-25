import {
  exerciseId,
  number,
  progress,
  rows,
  tables,
  trainingMaxes,
} from "./data";
import type { Row } from "./data";
const set = (extra: Row = {}): Row => ({
  "Session ID": "s1",
  Date: "9/1/2026",
  "Exercise Key": "bench",
  Equipment: "Barbell",
  "Load Type": "barbell_total",
  "Weight Unit": "lb",
  "Set Type": "main",
  "Rep Quality": "clean",
  "Actual Weight": "100",
  Reps: "5",
  ...extra,
});
it("preserves missing values and real zeros", () => {
  expect(number("")).toBeNull();
  expect(number("   ")).toBeNull();
  expect(number(undefined)).toBeNull();
  expect(number("0")).toBe(0);
  expect(rows([["Reps"], [0]], ["Reps"])[0].Reps).toBe("0");
});
it("rejects missing required columns", () => {
  expect(() => rows([["Other"]], ["Reps"])).toThrow();
});
it("floors training maxes to five while preserving zeros and unknown values", () => {
  const weights = [
    "247.5",
    "292.5",
    "180",
    "249.9",
    "250",
    "250.1",
    "1,002.5",
    "0",
    "",
    "invalid",
    "-1",
  ];
  const lifts = weights.map((weight) =>
    Object.freeze({ Lift: "Squat", "Training Max": weight })
  );
  expect(trainingMaxes(lifts).map((r) => r.weight)).toEqual([
    245,
    290,
    180,
    245,
    250,
    250,
    1000,
    0,
    null,
    null,
    null,
  ]);
  expect(lifts.map((r) => r["Training Max"])).toEqual(weights);
});
it("omits overhead press from training maxes without removing other lifts", () => {
  const lifts = [
    "Bench press",
    "Overhead press",
    " OHP ",
    "OVERHEAD_PRESS",
    "Squat",
    "Deadlift",
  ].map((Lift) => ({ Lift, "Training Max": "180" }));
  expect(trainingMaxes(lifts).map((r) => r.lift)).toEqual([
    "Bench press",
    "Squat",
    "Deadlift",
  ]);
  expect(
    trainingMaxes([{ Lift: "Overhead press", "Training Max": "103.5" }])
  ).toEqual([]);
});
it("uses actual work without substituting targets or mixing equipment", () => {
  const source = [
    set(),
    set({ "Actual Weight": "", "Planned Weight": "300" }),
    set({ "Set Type": "warmup", "Actual Weight": "400" }),
    set({ "Set Type": "rest_pause", "Actual Weight": "500" }),
    set({ "Rep Quality": "failed", "Actual Weight": "600" }),
    set({ Equipment: "Machine", "Actual Weight": "700" }),
    set({ "Actual Weight": "100", Reps: "8" }),
  ];
  expect(progress(source, exerciseId(set()))).toEqual([
    { date: "9/1/2026", session: "s1", weight: 100, reps: 8 },
  ]);
});
it("keeps bodyweight unweighted and orders sessions by calendar date", () => {
  const a = set({
    "Session ID": "later",
    Date: "10/1/2026",
    "Load Type": "bodyweight",
    "Actual Weight": "",
    Reps: "9",
  });
  const b = { ...a, "Session ID": "earlier", Date: "9/1/2026", Reps: "12" };
  expect(
    progress([a, b], exerciseId(a)).map((p) => [p.session, p.weight, p.reps])
  ).toEqual([
    ["earlier", null, 12],
    ["later", null, 9],
  ]);
});

it("parses grouped US numbers without treating malformed groups as valid", () => {
  expect(number("1,200")).toBe(1200);
  expect(number("1,234.5")).toBe(1234.5);
  expect(number(" -1,234,567.5 ")).toBe(-1234567.5);
  expect(number("+1,200")).toBe(1200);
  for (const malformed of [
    "1,2",
    "12,34",
    "1234,567",
    "1,,200",
    "1,200,",
    "1.200,5",
  ])
    expect(number(malformed)).toBeNull();
  const recorded = set({ "Actual Weight": "1,000" });
  expect(progress([recorded], exerciseId(recorded))[0]?.weight).toBe(1000);
});
it("rejects Set Log rows without the Date column before rendering progress", () => {
  const required = tables.find((table) => table.key === "sets")!.headers;
  const headers = [
    "Set ID",
    "Session ID",
    "Actual Weight",
    "Reps",
    "Exercise Key",
    "Equipment",
    "Load Type",
  ];
  expect(() =>
    rows(
      [
        headers,
        ["s1", "session1", 100, 5, "bench", "Barbell", "barbell_total"],
      ],
      required
    )
  ).toThrow();
});
