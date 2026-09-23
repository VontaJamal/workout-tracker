// Local-only, synthetic design preview. It never reads Sheets or permits writes.
const path = require("node:path");
const { mkdtempSync } = require("node:fs");
const { tmpdir } = require("node:os");
require("ts-node").register({ transpileOnly: true });
process.env.NODE_ENV = "production";
process.env.SESSION_SECRET = "synthetic-preview-no-account-access";
process.env.DATABASE_URL = `file:${path.join(
  mkdtempSync(path.join(tmpdir(), "form-preview-")),
  "unused.db"
)}`;
const { installGlobals, json } = require("@remix-run/node");
installGlobals();
const express = require("express");
const { createRequestHandler } = require("@remix-run/express");
const build = require("../build/index.js");
const { sampleWorkbook } = require("../test/fixtures/workouts.ts");
const data = sampleWorkbook();
const empty = { sessions: [], sets: [], cardio: [], lifts: [], prs: [] };
build.routes.root.module = {
  ...build.routes.root.module,
  loader: () => json({ user: null }),
};
build.routes["routes/index"].module = {
  ...build.routes["routes/index"].module,
  loader: async ({ request }) => {
    const url = new URL(request.url);
    const state = url.searchParams.get("state") || "ready";
    if (url.searchParams.get("delay"))
      await new Promise((resolve) => setTimeout(resolve, 1200));
    return json(
      {
        state: state === "empty" ? "ready" : state,
        data: state === "empty" ? empty : state === "ready" ? data : null,
        error:
          "Your spreadsheet could not be refreshed. Check the connection and try again.",
        synced: new Date().toISOString(),
        sheetUrl: "",
        signedIn: state !== "signed-out",
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  },
};
const app = express();
app.use((req, res, next) => {
  res.setHeader("X-Preview-Data", "synthetic-samples");
  if (req.method !== "GET" && req.method !== "HEAD")
    return res.status(405).send("This synthetic design preview is read-only.");
  next();
});
app.use(express.static(path.resolve(__dirname, "../public")));
app.all("*", createRequestHandler({ build, mode: "production" }));
const port = Number(process.env.PREVIEW_PORT || 4182);
app.listen(port, "127.0.0.1", () =>
  console.log(`FORM synthetic preview: http://localhost:${port}`)
);
