import { useState } from "react";
import type { SyntheticEvent } from "react";
import { XMarkIcon as XIcon } from "@heroicons/react/20/solid";

export default function Index() {
  const [workout, setWorkout] = useState("");
  const [workoutList, setWorkoutList] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  function submitForm(e: SyntheticEvent) {
    e.preventDefault();
    if (!workout) return;
    setWorkout("");
  }

  function removeWorkout(workout: string): void {
    setWorkoutList((currentList) =>
      currentList.filter((current) => current !== workout)
    );
  }

  function displayWorkout(workout: string): JSX.Element {
    return (
      <li key={workout} className="flex items-center justify-center">
        {workout}
        <XIcon
          className="h-6 cursor-pointer hover:text-red-600"
          onClick={() => removeWorkout(workout)}
        />
      </li>
    );
  }

  return (
    <main className="relative min-h-screen flex-col gap-8 bg-white sm:flex sm:items-center sm:justify-center">
      <button
        className="rounded-full border border-gray-400 p-6"
        onClick={() => setIsStarted(true)}
      >
        Work!
      </button>
      <form onSubmit={submitForm}>
        <input
          name="workout-name"
          onChange={(e) => setWorkout(e.target.value)}
          value={workout}
          type="text"
          className="border-4 border-blue-700"
        />
        <button onClick={() => setWorkoutList([...workoutList, workout])}>
          Add workout
        </button>
      </form>
      <ul>{workoutList.map(displayWorkout)}</ul>
    </main>
  );
}
