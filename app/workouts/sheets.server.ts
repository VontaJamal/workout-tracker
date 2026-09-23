import { createSign } from "node:crypto";
import { rows, tables } from "./data";
import type { Workbook } from "./data";
const tokenUrl = "https://oauth2.googleapis.com/token";
export function configured() {
  return Boolean(
    process.env.GOOGLE_SHEETS_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}
async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const encode = (v: object) =>
    Buffer.from(JSON.stringify(v)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: tokenUrl,
    iat: now,
    exp: now + 3600,
  })}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  sign.end();
  const signature = sign.sign(
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    "base64url"
  );
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      "Google authorization failed. Check the server credentials."
    );
  const data = await response.json();
  if (typeof data.access_token !== "string")
    throw new Error("Google authorization failed.");
  return data.access_token as string;
}
export async function readWorkbook(): Promise<Workbook> {
  const token = await getToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      process.env.GOOGLE_SHEETS_ID!
    )}/values:batchGet`
  );
  // Entire populated columns are read so new rows remain visible beyond the original grid size.
  tables.forEach((t) =>
    url.searchParams.append("ranges", `'${t.tab}'!A:${t.end}`)
  );
  url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      "Could not read the workout sheet. Check sharing, tab names, and the Sheets API."
    );
  const data = await response.json();
  return Object.fromEntries(
    tables.map((t, i) => [
      t.key,
      rows(data.valueRanges?.[i]?.values || [], t.headers),
    ])
  ) as Workbook;
}
