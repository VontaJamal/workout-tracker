import { addDays, calendarDate, easternDate, overview } from "./overview";
import type { Workbook, Row } from "./data";
const workbook = (sessions: Row[] = [], cardio: Row[] = []): Workbook => ({
  sessions,
  cardio,
  sets: [],
  lifts: [],
  prs: [],
});
const session = (id: string, date: string) => ({
  "Session ID": id,
  Date: date,
  Workout: "A",
});
it("uses the Eastern calendar date across midnight and daylight saving changes", () => {
  expect(easternDate("2026-09-24T02:00:00Z")).toBe("2026-09-23");
  expect(easternDate("2026-01-02T04:00:00Z")).toBe("2026-01-01");
  expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
});
it("validates dates without inventing a day for invalid input", () => {
  expect(calendarDate("2/29/2024")).toBe("2024-02-29");
  expect(calendarDate("2/29/2026")).toBeNull();
  expect(calendarDate("9/31/2026")).toBeNull();
  expect(calendarDate("")).toBeNull();
});
it("counts distinct sessions and training days, leaving future dates out", () => {
  const source = workbook([
    session("a", "9/21/2026"),
    session("a", "9/21/2026"),
    session("b", "9/21/2026"),
    session("c", "9/23/2026"),
    session("future", "9/25/2026"),
    session("invalid", "bad date"),
  ]);
  const result = overview(source, 4, "2026-09-23");
  expect(result.sessionCount).toBe(3);
  expect(result.trainingDays).toBe(2);
  expect(result.days.get("2026-09-21")).toBe(2);
  expect(result.undatedSessions).toBe(1);
  expect(result.latest?.["Session ID"]).toBe("c");
});
it("uses Monday boundaries across years and changes the shared period", () => {
  const source = workbook([
    session("a", "8/31/2026"),
    session("b", "8/30/2026"),
    session("c", "7/1/2026"),
  ]);
  expect(overview(source, 4, "2026-09-23").sessionCount).toBe(1);
  expect(overview(source, 12, "2026-09-23").sessionCount).toBe(2);
  expect(overview(source, 26, "2026-09-23").sessionCount).toBe(3);
  const result = overview(workbook(), 4, "2027-01-01");
  expect(result.start).toBe("2026-12-07");
  expect(result.weeks[3]).toMatchObject({ date: "2026-12-28", partial: true });
  expect(result.weeks.slice(0, 3).every((w) => !w.partial)).toBe(true);
});
it("preserves zero, formatted durations, missing values, duplicate IDs and unplaceable cardio", () => {
  const entries = ["1,200", "0", "", "oops", "-30"].map((duration, i) => ({
    "Cardio ID": String(i),
    "Session ID": "a",
    "Duration Seconds": duration,
  }));
  const result = overview(
    workbook(
      [session("a", "9/23/2026")],
      [
        ...entries,
        entries[0],
        {
          "Cardio ID": "undated",
          "Session ID": "unknown",
          "Duration Seconds": "600",
        },
      ]
    ),
    4,
    "2026-09-23"
  );
  expect(result.seconds).toBe(1200);
  expect(result.knownDurations).toBe(2);
  expect(result.unknownDurations).toBe(3);
  expect(result.undatedCardio).toBe(1);
  expect(result.weeks[3].cardioEntries).toBe(5);
});
it("keeps unknown-only cardio separate from recorded zero and supports a cardio date without a session", () => {
  const result = overview(
    workbook(
      [],
      [{ "Cardio ID": "a", Date: "9/23/2026", "Duration Seconds": "" }]
    ),
    4,
    "2026-09-23"
  );
  expect(result.weeks[3]).toMatchObject({
    seconds: 0,
    knownDurations: 0,
    unknownDurations: 1,
    cardioEntries: 1,
  });
  expect(result.trainingDays).toBe(0);
});
it("keeps empty periods empty without fabricating activity", () => {
  const result = overview(workbook(), 12, "2026-09-23");
  expect(result.weeks).toHaveLength(12);
  expect(result.sessionCount).toBe(0);
  expect(result.trainingDays).toBe(0);
  expect(result.latest).toBeUndefined();
});
