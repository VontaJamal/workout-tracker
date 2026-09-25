import { dateKey, number } from "./data";
import type { Row, Workbook } from "./data";

export type WeekRange = 4 | 12 | 26;
const DAY = 86400000;
// Calendar-only arithmetic avoids daylight-saving shifts. These dates have no time of day.
export function calendarDate(value: string): string | null {
  const key = dateKey(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const parsed = new Date(`${key}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === key
    ? key
    : null;
}
export function easternDate(instant: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instant));
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function addDays(key: string, days: number): string {
  return new Date(new Date(`${key}T12:00:00Z`).getTime() + days * DAY)
    .toISOString()
    .slice(0, 10);
}
export function monday(key: string): string {
  return addDays(key, -((new Date(`${key}T12:00:00Z`).getUTCDay() + 6) % 7));
}
export function shortDate(key: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(`${key}T12:00:00Z`));
}
export function uniqueSessions(source: Row[]): Row[] {
  const seen = new Set<string>();
  return source
    .filter((row) => {
      const id = row["Session ID"];
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => dateKey(b.Date).localeCompare(dateKey(a.Date)));
}
export type Week = {
  date: string;
  sessions: number;
  seconds: number;
  knownDurations: number;
  unknownDurations: number;
  cardioEntries: number;
  partial: boolean;
};
export function overview(data: Workbook, range: WeekRange, today: string) {
  const start = addDays(monday(today), -(range - 1) * 7);
  const weeks: Week[] = Array.from({ length: range }, (_, i) => ({
    date: addDays(start, i * 7),
    sessions: 0,
    seconds: 0,
    knownDurations: 0,
    unknownDurations: 0,
    cardioEntries: 0,
    partial: i === range - 1,
  }));
  const sessions = uniqueSessions(data.sessions);
  const sessionDates = new Map(
    sessions.map((s) => [s["Session ID"], calendarDate(s.Date)])
  );
  const inRange = (date: string | null): date is string =>
    !!date && date >= start && date <= today;
  const days = new Map<string, number>();
  sessions.forEach((session) => {
    const date = calendarDate(session.Date);
    if (!inRange(date)) return;
    days.set(date, (days.get(date) || 0) + 1);
    weeks.find((w) => w.date === monday(date))!.sessions++;
  });
  const seenCardio = new Set<string>();
  let undatedCardio = 0;
  data.cardio.forEach((entry) => {
    const id = entry["Cardio ID"];
    if (!id || seenCardio.has(id)) return;
    seenCardio.add(id);
    const date =
      sessionDates.get(entry["Session ID"]) || calendarDate(entry.Date);
    if (!date) {
      undatedCardio++;
      return;
    }
    if (!inRange(date)) return;
    const week = weeks.find((w) => w.date === monday(date))!;
    const seconds = number(entry["Duration Seconds"]);
    week.cardioEntries++;
    if (seconds === null || seconds < 0) week.unknownDurations++;
    else {
      week.seconds += seconds;
      week.knownDurations++;
    }
  });
  return {
    start,
    today,
    weeks,
    days,
    trainingDays: days.size,
    sessionCount: weeks.reduce((total, w) => total + w.sessions, 0),
    seconds: weeks.reduce((total, w) => total + w.seconds, 0),
    knownDurations: weeks.reduce((total, w) => total + w.knownDurations, 0),
    unknownDurations: weeks.reduce((total, w) => total + w.unknownDurations, 0),
    undatedCardio,
    undatedSessions: sessions.filter((s) => !calendarDate(s.Date)).length,
    latest: sessions.find((s) => {
      const date = calendarDate(s.Date);
      return date && date <= today;
    }),
  };
}
