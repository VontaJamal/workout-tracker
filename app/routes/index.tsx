import type { SyntheticEvent } from "react";
import { useState } from "react";

export default function Index() {
  const [workout, setWorkout] = useState("");
  const [workoutList, setWorkoutList] = useState<string[]>([]);

  function submitForm(e: SyntheticEvent) {
    e.preventDefault();
    console.log("first");
    setWorkout("");
  }

  function displayWorkout(workout: string) {
    return <p key={workout}>{workout}</p>;
  }

  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <form onSubmit={submitForm}>
        <input
          name="workout-name"
          onChange={(e) => setWorkout(e.target.value)}
          value={workout}
          type="text"
        />
        <button onClick={() => setWorkoutList([...workoutList, workout])}>
          Add workout
        </button>
      </form>

      {workoutList.map(displayWorkout)}
    </main>
  );
}
