import { dashboardData } from "./dashboard.server";
it("never reads Sheets for signed-out, unapproved, or unconfigured owner access", async () => {
  let reads = 0;
  const read = async () => {
    reads++;
    return { sessions: [], sets: [], cardio: [], lifts: [], prs: [] };
  };
  for (const user of [undefined, "stranger"]) {
    const result = await dashboardData(user, {
      ownerId: "owner",
      configured: true,
      read,
    });
    expect(result.data).toBeNull();
    expect(result.sheetUrl).toBe("");
  }
  expect((await dashboardData("owner", { configured: true, read })).state).toBe(
    "restricted"
  );
  expect(
    (
      await dashboardData("owner", {
        ownerId: "owner",
        configured: false,
        read,
      })
    ).state
  ).toBe("setup");
  expect(reads).toBe(0);
});
it("sanitizes upstream errors and supplies fresh data to the authorized owner", async () => {
  const options = { ownerId: "owner", sheetId: "test-sheet", configured: true };
  const failed = await dashboardData("owner", {
    ...options,
    read: async () => {
      throw new Error("secret");
    },
  });
  expect(failed.state).toBe("error");
  expect(JSON.stringify(failed)).not.toContain("secret");
  expect(failed.data).toBeNull();
  const workbook = { sessions: [], sets: [], cardio: [], lifts: [], prs: [] };
  const ready = await dashboardData("owner", {
    ...options,
    read: async () => workbook,
  });
  expect(ready.state).toBe("ready");
  expect(ready.data).toEqual(workbook);
  expect(ready.synced).not.toBe("");
});
