import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@testing-library/react";
import { Journal } from "./journal";
import { sampleWorkbook } from "../../test/fixtures/workouts";
afterEach(cleanup);
it("keeps older sessions available through pagination and resets the page when filtering", async () => {
  const user = userEvent.setup();
  render(<Journal data={sampleWorkbook("2026-09-23")} />);
  expect(document.querySelectorAll(".session")).toHaveLength(8);
  await user.click(screen.getByRole("button", { name: /Show more workouts/ }));
  expect(document.querySelectorAll(".session")).toHaveLength(16);
  await user.selectOptions(screen.getByLabelText("Workout"), "Lower body");
  expect(document.querySelectorAll(".session")).toHaveLength(8);
  expect(
    Array.from(document.querySelectorAll(".session summary")).every((s) =>
      s.textContent?.includes("Lower body")
    )
  ).toBe(true);
});
