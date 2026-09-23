import { exerciseId, number, progress, rows } from "./data";
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
  expect(number("0")).toBe(0);
  expect(rows([["Reps"], [0]], ["Reps"])[0].Reps).toBe("0");
});
it("rejects missing required columns", () => {
  expect(() => rows([["Other"]], ["Reps"])).toThrow();
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
