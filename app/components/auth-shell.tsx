import type { ReactNode } from "react";
import { Brand, Spark } from "./brand";
export function AuthShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="tracker auth-page">
      <header className="topbar">
        <Brand />
        <a className="text-button" href="/">
          Back to overview ↗
        </a>
      </header>
      <main className="auth-layout">
        <section className="welcome-art">
          <p className="eyebrow">YOUR WORKOUT JOURNAL</p>
          <h1>
            Make your
            <br />
            effort visible<span>.</span>
          </h1>
          <p>
            Your sessions, your strength, your rhythm. See the work you put in.
          </p>
          <Spark className="welcome-spark" />
          <div className="decorative-track" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </section>
        <section className="auth-form">
          <p className="eyebrow">LET’S GET INTO IT</p>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
          {children}
        </section>
      </main>
    </div>
  );
}
