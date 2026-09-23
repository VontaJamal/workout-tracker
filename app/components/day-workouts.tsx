import { useEffect, useId, useRef } from "react";
import type { Workbook } from "~/workouts/data";
import { calendarDate, shortDate, uniqueSessions } from "~/workouts/overview";
import { SessionDetails } from "./session-details";

export function DayWorkouts({
  date,
  data,
  onClose,
}: {
  date: string;
  data: Workbook;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const sessions = uniqueSessions(data.sessions).filter(
    (session) => calendarDate(session.Date) === date
  );
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    // Keep the page behind the dialog in place, including on a phone.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="workout-dialog"
      aria-labelledby={title}
      onClose={(event) => {
        // A queued close event can arrive after StrictMode has reopened it.
        if (!event.currentTarget.open) onClose();
      }}
    >
      <header className="day-header">
        <div>
          <p className="eyebrow">WORKOUT DETAILS</p>
          <h2 id={title}>
            {shortDate(date)}, {date.slice(0, 4)}
          </h2>
        </div>
        <button
          type="button"
          className="dialog-close"
          onClick={() => dialog.current?.close()}
          aria-label="Close workout details"
        >
          ✕
        </button>
      </header>
      <div className="day-content">
        {sessions.length ? (
          sessions.map((session) => (
            <article className="day-session" key={session["Session ID"]}>
              <div className="day-session-title">
                <h3>
                  {session.Workout || "Workout"}
                  {session["Main Lift Focus"]
                    ? ` · ${session["Main Lift Focus"]}`
                    : ""}
                </h3>
                {session["Program Week"] && (
                  <span className="pill violet-pill">
                    Week {session["Program Week"]}
                  </span>
                )}
              </div>
              {session.Focus && <p className="muted">{session.Focus}</p>}
              <SessionDetails session={session} data={data} />
            </article>
          ))
        ) : (
          <p className="empty">No workouts recorded on this day.</p>
        )}
      </div>
    </dialog>
  );
}
