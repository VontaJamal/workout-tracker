import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionDetails } from "./session-details";
import { Records } from "./records";
import type { Workbook } from "~/workouts/data";
import { sampleWorkbook } from "../../test/fixtures/workouts";
afterEach(cleanup);
it("hides RIR and rep quality while preserving original notes and watch stats", () => {
  const data: Workbook = {
    sessions: [],
    lifts: [],
    prs: [],
    sets: [
      {
        "Session ID": "a",
        "Set ID": "a",
        Exercise: "Squat",
        "Set Type": "main",
        "RIR Min": "2",
        "Rep Quality": "unknown",
        Notes: "Keep this note.",
      },
    ],
    cardio: [
      {
        "Session ID": "a",
        "Cardio ID": "a",
        Activity: "Run",
        "Duration Seconds": "1200",
        Calories: "240",
        "Avg HR": "132",
        "Max HR": "160",
        Steps: "0",
        "Zone Minutes": "",
        "Device Distance Miles": "2",
        "Data Source": "watch_photo",
        Notes: "Photo: https://drive.google.com/file/d/example/view",
      },
    ],
  };
  render(<SessionDetails session={{ "Session ID": "a" }} data={data} />);
  expect(screen.queryByText(/RIR|Rep quality|unknown/)).not.toBeInTheDocument();
  expect(screen.getByText("Keep this note.")).toBeInTheDocument();
  expect(screen.getByText("240")).toBeInTheDocument();
  expect(screen.getByText("132")).toBeInTheDocument();
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.queryByText("Zone minutes")).not.toBeInTheDocument();
  const link = screen.getByRole("link", { name: /Open source link/ });
  expect(link).toHaveAttribute(
    "href",
    "https://drive.google.com/file/d/example/view"
  );
  expect(link).toHaveAttribute("rel", "noreferrer");
  expect(document.querySelector("img,video,iframe")).toBeNull();
});
it("keeps unknown cardio duration unknown and does not invent calories", () => {
  const data: Workbook = {
    sessions: [],
    sets: [],
    lifts: [],
    prs: [],
    cardio: [
      {
        "Session ID": "a",
        "Cardio ID": "c",
        Activity: "Walk",
        "Duration Seconds": "-1",
        Calories: "",
      },
    ],
  };
  render(<SessionDetails session={{ "Session ID": "a" }} data={data} />);
  expect(screen.getByText("Unknown")).toBeInTheDocument();
  expect(screen.queryByText("Calories")).not.toBeInTheDocument();
});
it("shows historical targets and allows separate rep records at each actual weight and bodyweight", async () => {
  const data = sampleWorkbook("2026-09-23");
  render(<Records data={data} />);
  expect(
    screen.getByRole("heading", { name: /Hall of Fame/ })
  ).toBeInTheDocument();
  expect(document.querySelector(".record-number")).toHaveTextContent(
    "165 lb × 5 reps"
  );
  expect(screen.getByText("Most reps in one day")).toBeInTheDocument();
  const user = userEvent.setup();
  const load = screen.getByLabelText("At this weight");
  const options = Array.from(load.querySelectorAll("option"));
  await user.selectOptions(load, options[options.length - 1].value);
  expect(load).toHaveValue(options[options.length - 1].value);
  const exercise = screen.getByLabelText("Exercise & equipment");
  const bodyweight = Array.from(exercise.querySelectorAll("option")).find((o) =>
    o.textContent?.includes("Pull-up")
  )!;
  await user.selectOptions(exercise, bodyweight.value);
  expect(screen.queryByLabelText("At this weight")).not.toBeInTheDocument();
  expect(screen.getByText(/Bodyweight ·/)).toBeInTheDocument();
});
