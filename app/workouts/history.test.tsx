import { vi } from "vitest";
import type IndexComponent from "../routes/index";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../session.server", () => ({ getUser: vi.fn() }));
vi.mock("./sheets.server", () => ({
  configured: vi.fn(),
  readWorkbook: vi.fn(),
}));
vi.mock("@remix-run/react", () => ({
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
      lifts: [],
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
