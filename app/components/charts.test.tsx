import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@testing-library/react";
import { ActivityCalendar, StrengthChart, WeeklyChart } from "./charts";
import { overview } from "~/workouts/overview";
import type { Workbook } from "~/workouts/data";
afterEach(cleanup);
const data: Workbook = {
  sessions: [{ "Session ID": "a", Date: "9/22/2026", Workout: "A" }],
  sets: [],
  cardio: [],
  prs: [],
  lifts: [],
};
it("exposes calendar dates and responds to selection without marking future days as missed", async () => {
  const user = userEvent.setup();
  render(<ActivityCalendar summary={overview(data, 4, "2026-09-23")} />);
  const day = screen.getByRole("button", { name: "Sep 22, 2026: 1 session" });
  await user.click(day);
  expect(day).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("status")).toHaveTextContent("1 session recorded");
  expect(
    screen.getByRole("button", { name: "Sep 24, 2026: Future date" })
  ).toBeDisabled();
});
it("distinguishes unknown-only duration from an empty cardio week", () => {
  const source = {
    ...data,
    cardio: [{ "Cardio ID": "a", "Session ID": "a", "Duration Seconds": "" }],
  };
  render(
    <WeeklyChart
      weeks={overview(source, 4, "2026-09-23").weeks}
      metric="cardio"
    />
  );
  expect(
    screen.getByRole("button", {
      name: /Sep 21.*Duration unknown.*1 missing duration/,
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Sep 14.*No cardio recorded/ })
  ).toBeInTheDocument();
});
it("renders a single strength point and preserves bodyweight reps", () => {
  render(
    <StrengthChart
      unit=""
      bodyweight
      points={[{ date: "9/22/2026", session: "a", weight: null, reps: 8 }]}
    />
  );
  expect(
    screen.getByRole("img", { name: /Working-set reps/ })
  ).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Bodyweight · 8 reps");
  expect(document.querySelectorAll("circle")).toHaveLength(1);
  expect(document.querySelector("path")).toBeNull();
});
it("offers exact values and changes the selected strength session", async () => {
  const user = userEvent.setup();
  render(
    <StrengthChart
      unit="lb"
      bodyweight={false}
      points={[
        { date: "9/1/2026", session: "a", weight: 100, reps: 8 },
        { date: "9/22/2026", session: "b", weight: 110, reps: 5 },
      ]}
    />
  );
  await user.selectOptions(screen.getByLabelText("Inspect a session"), "a");
  expect(screen.getByRole("status")).toHaveTextContent("100 lb · 8 reps");
});
