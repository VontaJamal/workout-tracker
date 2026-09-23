import type { Workbook } from "../../app/workouts/data";
import { addDays, easternDate, monday } from "../../app/workouts/overview";
// Synthetic data only. Used by local design previews and component/browser checks.
export function sampleWorkbook(today = easternDate(new Date())): Workbook {
  const data: Workbook = {
    sessions: [],
    sets: [],
    cardio: [],
    lifts: [],
    prs: [],
  };
  const start = addDays(monday(today), -77);
  const format = (key: string) => {
    const [year, month, day] = key.split("-");
    return `${Number(month)}/${Number(day)}/${year}`;
  };
  for (let week = 0; week < 12; week++) {
    const offsets =
      week % 3 === 0 ? [0, 3] : week % 4 === 0 ? [1, 3, 5, 6] : [0, 2, 4];
    offsets.forEach((offset, index) => {
      const date = addDays(start, week * 7 + offset);
      if (date > today) return;
      const id = `sample-${week}-${index}`,
        bench = index % 2 === 0;
      const lift = bench ? "Bench press" : "Squat";
      data.sessions.push({
        "Session ID": id,
        Date: format(date),
        Workout: bench ? "Upper body" : "Lower body",
        "Main Lift Focus": lift,
        "Program Week": String((week % 3) + 1),
        Focus: bench ? "Push + pull" : "Legs + core",
        Notes: "Synthetic workout for design review.",
      });
      [0, 1, 2].forEach((set) =>
        data.sets.push({
          "Set ID": `${id}-${set}`,
          "Session ID": id,
          Date: format(date),
          "Exercise Key": bench ? "bench_press" : "squat",
          Exercise: lift,
          Equipment: "Barbell",
          "Load Type": "barbell_total",
          "Weight Unit": "lb",
          "Set Type": set === 0 ? "warmup" : "main",
          "Set Number": String(set + 1),
          "Actual Weight": String(
            set === 0 ? 45 : (bench ? 115 : 165) + week * 2.5
          ),
          "Planned Weight": String(
            set === 0 ? 45 : (bench ? 115 : 165) + week * 2.5
          ),
          Reps: String(set === 2 ? 7 : 5),
          "Rep Quality": "clean",
          "RIR Min": "1",
          "RIR Max": "2",
          Notes: set === 2 ? "Controlled final reps." : "",
        })
      );
      if (bench)
        data.sets.push({
          "Set ID": `${id}-bw`,
          "Session ID": id,
          Date: format(date),
          "Exercise Key": "pull_up",
          Exercise: "Pull-up",
          Equipment: "Pull-up bar",
          "Load Type": "bodyweight",
          "Weight Unit": "",
          "Actual Weight": "",
          Reps: String(5 + Math.floor(week / 2)),
          "Set Type": "assistance",
          "Rep Quality": "unknown",
        });
      if (index === 0 || week % 2 === 0)
        data.cardio.push({
          "Cardio ID": `${id}-cardio`,
          "Session ID": id,
          Activity: "Treadmill walk",
          "Duration Seconds": week === 9 ? "" : String((15 + week * 2) * 60),
          Incline: "4",
          "Speed MPH": "3.0",
          Notes: "Easy finish.",
        });
    });
  }
  const last = data.sessions[data.sessions.length - 1];
  if (last)
    data.sets.push({
      "Set ID": "sample-supplemental",
      "Session ID": last["Session ID"],
      Date: last.Date,
      Exercise: "Romanian deadlift",
      "Exercise Key": "romanian_deadlift",
      Equipment: "Dumbbells",
      "Set Type": "supplemental",
      "Actual Weight": "40",
      "Weight Unit": "lb",
      "Load Type": "external_load",
      Reps: "10",
      Notes: "Weight per dumbbell.",
    });
  const circuit = data.sessions[Math.max(0, data.sessions.length - 2)];
  if (circuit) {
    circuit.Workout = "Full body circuit";
    circuit["Main Lift Focus"] = "";
    circuit.Focus = "Three movements, equal focus";
    data.sets = data.sets.filter(
      (s) => s["Session ID"] !== circuit["Session ID"]
    );
    ["Goblet squat", "Push-up", "Dumbbell row"].forEach((Exercise, i) =>
      data.sets.push({
        "Set ID": `circuit-${i}`,
        "Session ID": circuit["Session ID"],
        Date: circuit.Date,
        Exercise,
        "Exercise Key": Exercise.toLowerCase().replace(/ /g, "_"),
        Equipment: i === 1 ? "Floor" : "Dumbbells",
        "Set Type": "working",
        "Set Number": "1",
        "Load Type": i === 1 ? "bodyweight" : "external_load",
        "Actual Weight": i === 1 ? "" : "30",
        "Weight Unit": i === 1 ? "" : "lb",
        Reps: "12",
      })
    );
  }
  const watch = data.sessions[Math.max(0, data.sessions.length - 3)];
  if (watch) {
    watch.Workout = "Cardio";
    watch["Main Lift Focus"] = "";
    watch.Focus = "Outdoor run";
    data.sets = data.sets.filter(
      (s) => s["Session ID"] !== watch["Session ID"]
    );
    data.cardio = data.cardio.filter(
      (r) => r["Session ID"] !== watch["Session ID"]
    );
    data.cardio.push({
      "Cardio ID": "sample-watch",
      "Session ID": watch["Session ID"],
      Activity: "Outdoor run",
      "Duration Seconds": "1860",
      Calories: "284",
      "Avg HR": "138",
      "Max HR": "164",
      Steps: "4210",
      "Device Distance Miles": "2.6",
      "Distance Source": "Watch GPS",
      "Zone Minutes": "26",
      "Data Source": "watch_photo",
      Notes: "Synthetic watch stats for design review.",
    });
  }
  data.sessions.push({
    "Session ID": "sample-old",
    Date: format(addDays(today, -300)),
    Workout: "Upper body",
    "Main Lift Focus": "Bench press",
    Notes: "An older synthetic session. Still available in the journal.",
  });
  data.lifts = [
    ["Bench press", "200", "180"],
    ["Squat", "275", "247.5"],
    ["Deadlift", "325", "292.5"],
    ["Overhead press", "115", "103.5"],
  ].map(([Lift, input, max]) => ({
    Lift,
    "Program 1RM Input": input,
    "Training Max": max,
  }));
  data.prs = [
    ["Bench press", "5", "165", "192.5"],
    ["Bench press", "8", "150", "190"],
    ["Squat", "5", "225", "262.5"],
    ["Deadlift", "3", "295", "324.5"],
    ["Overhead press", "5", "95", "110.8"],
  ].map(([Lift, Reps, max, estimate]) => ({
    Lift,
    Reps,
    "Rep Max": max,
    "Est. 1RM": estimate,
  }));
  return data;
}
