import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ActivityCalendar, StrengthChart, WeeklyChart } from "./charts";
import { overview } from "~/workouts/overview";
import type { Workbook } from "~/workouts/data";
// happy-dom 8 does not apply the browser's open-dialog display rule.
// Real focus containment and Escape behavior are verified in browser checks.
beforeAll(() => {
  const nativeShowModal = HTMLDialogElement.prototype.showModal;
  vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(
    function (this: HTMLDialogElement) {
      nativeShowModal.call(this);
      this.style.display = "block";
    }
  );
});
afterAll(() => vi.restoreAllMocks());
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
  render(
    <ActivityCalendar summary={overview(data, 4, "2026-09-23")} data={data} />
  );
  const day = screen.getByRole("button", { name: "Sep 22, 2026: 1 session" });
  await user.click(day);
  expect(day).toHaveAttribute("aria-pressed", "true");
  await user.click(
    screen.getByRole("button", { name: "Close workout details" })
  );
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

const dailyWorkouts: Workbook = {
  ...data,
  sessions: [
    {
      "Session ID": "a",
      Date: "9/22/2026",
      Workout: "Upper body",
      "Main Lift Focus": "Bench press",
      "Program Week": "2",
      Focus: "Push and pull",
      Notes: "Solid last set.",
    },
    {
      "Session ID": "b",
      Date: "9/22/2026",
      Workout: "Evening walk",
      Notes: "Easy pace.",
    },
    { "Session ID": "other", Date: "9/21/2026", Workout: "Unrelated workout" },
  ],
  sets: [
    {
      "Session ID": "a",
      "Set ID": "set-a",
      Exercise: "Bench press",
      "Actual Weight": "135",
      "Weight Unit": "lb",
      "Planned Weight": "130",
      Reps: "7",
      "Set Type": "main",
      "Rep Quality": "unknown",
    },
  ],
  cardio: [
    {
      "Cardio ID": "walk",
      "Session ID": "b",
      Activity: "Outdoor walk",
      "Duration Seconds": "1,200",
      Notes: "Neighborhood loop.",
    },
  ],
};
it("opens the selected day's actual workouts, sets, notes, and cardio instead of just repeating a count", async () => {
  const user = userEvent.setup();
  const props = {
    summary: overview(dailyWorkouts, 4, "2026-09-23"),
    data: dailyWorkouts,
  };
  render(<ActivityCalendar {...props} />);
  await user.click(
    screen.getByRole("button", { name: "Sep 22, 2026: 2 sessions" })
  );
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveTextContent("Upper body");
  expect(dialog).toHaveTextContent("Bench press");
  expect(
    screen.getByRole("cell", { name: "135", exact: true })
  ).toBeInTheDocument();
  expect(dialog).toHaveTextContent("Solid last set.");
  expect(dialog).toHaveTextContent("Evening walk");
  expect(dialog).toHaveTextContent("20.0 min");
  expect(dialog).not.toHaveTextContent("Rep quality:");
  expect(dialog).not.toHaveTextContent("Unrelated workout");
  await user.click(
    screen.getByRole("button", { name: "Close workout details" })
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("shows an honest empty day without carrying over a previous day's workouts", async () => {
  const user = userEvent.setup();
  const props = {
    summary: overview(dailyWorkouts, 4, "2026-09-23"),
    data: dailyWorkouts,
  };
  render(<ActivityCalendar {...props} />);
  await user.click(
    screen.getByRole("button", { name: "Sep 23, 2026: No session recorded" })
  );
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "No workouts recorded on this day."
  );
  expect(screen.getByRole("dialog")).not.toHaveTextContent("Bench press");
});

it("keeps a reopened dialog visible when an earlier close event arrives", async () => {
  const user = userEvent.setup();
  render(
    <ActivityCalendar
      summary={overview(dailyWorkouts, 4, "2026-09-23")}
      data={dailyWorkouts}
    />
  );
  await user.click(
    screen.getByRole("button", { name: "Sep 22, 2026: 2 sessions" })
  );
  const dialog = screen.getByRole("dialog");
  // Browsers queue close events; StrictMode can reopen the dialog before one arrives.
  fireEvent(dialog, new Event("close"));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
