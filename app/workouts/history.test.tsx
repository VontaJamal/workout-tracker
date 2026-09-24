import { vi } from "vitest";
import type IndexComponent from "../routes/index";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../session.server", () => ({ getUser: vi.fn() }));
vi.mock("./sheets.server", () => ({
  configured: vi.fn(),
  readWorkbook: vi.fn(),
}));
vi.mock("@remix-run/react", () => ({
  useLocation: () => ({ search: "" }),
  Form: () => null,
  Link: () => null,
  useRevalidator: () => ({ state: "idle", revalidate: vi.fn() }),
  useLoaderData: () => ({
    state: "ready",
    signedIn: true,
    synced: "2026-09-23T12:00:00Z",
    sheetUrl: "",
    error: "",
    data: {
      sessions: [{ "Session ID": "s1", Date: "9/23/2026", Workout: "A" }],
      sets: [
        {
          "Set ID": "set1",
          "Session ID": "s1",
          Date: "9/23/2026",
          Exercise: "Pull-up",
          "Exercise Key": "pull_up",
          Equipment: "Bar",
          "Load Type": "bodyweight",
          Reps: "5",
          "Rep Quality": "unknown",
        },
      ],
      cardio: [
        {
          "Cardio ID": "c1",
          "Session ID": "s1",
          Activity: "Walk",
          "Duration Seconds": "1,200",
        },
      ],
      lifts: [
        { Lift: "Bench", "Program 1RM Input": "200", "Training Max": "180" },
        { Lift: "Squat", "Training Max": "247.5" },
        { Lift: "Deadlift", "Training Max": "292.5" },
        { Lift: "Overhead press", "Training Max": "103.5" },
      ],
      prs: [
        {
          Lift: "Leg press",
          Reps: "5",
          "Rep Max": "1,000",
          "Est. 1RM": "1,166.7",
        },
      ],
    },
  }),
}));

let Index: typeof IndexComponent;
beforeAll(async () => {
  Index = (await import("../routes/index")).default;
});

it("keeps rep quality out of the visible session history", () => {
  expect(renderToStaticMarkup(<Index />)).not.toContain("Rep quality:");
});
it("renders formatted cardio durations and historical records as numbers", () => {
  const view = renderToStaticMarkup(<Index />);
  expect(view).toContain("20.0 min");
  expect(view).toContain("1,000");
  expect(view).toContain("1166.7");
});

it("shows rounded-down training maxes without overhead press or internal labels", () => {
  const view = renderToStaticMarkup(<Index />);
  expect(view).toContain("Base weights used to calculate your workout sets.");
  expect(view).toContain("180");
  expect(view).toContain("<strong>245</strong>");
  expect(view).toContain("<strong>290</strong>");
  expect(view).not.toContain("247.5");
  expect(view).not.toContain("292.5");
  expect(view).not.toContain("Overhead press");
  expect(view).not.toContain("Program input");
  expect(view).not.toContain("lb TM");
});
