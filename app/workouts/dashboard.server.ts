import type { Workbook } from "./data";
export async function dashboardData(
  userId: string | undefined,
  options: {
    ownerId?: string;
    sheetId?: string;
    configured: boolean;
    read: () => Promise<Workbook>;
  }
) {
  let state = "signed-out",
    error = "",
    data: Workbook | null = null,
    synced = "",
    sheetUrl = "";
  if (userId) {
    if (!options.ownerId || userId !== options.ownerId) state = "restricted";
    else if (!options.configured) state = "setup";
    else {
      try {
        data = await options.read();
        state = "ready";
        synced = new Date().toISOString();
        sheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
          options.sheetId!
        )}/edit`;
      } catch {
        state = "error";
        error =
          "Your spreadsheet could not be refreshed. Check the connection and try again.";
      }
    }
  }
  return { state, error, data, synced, sheetUrl, signedIn: !!userId };
}
