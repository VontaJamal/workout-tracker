export function Brand() {
  return (
    <a className="brand" href="/" aria-label="FORM home">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      form<span className="brand-dot">.</span>
    </a>
  );
}
export function Spark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M50 0 59 31 85 15 69 41 100 50 69 59 85 85 59 69 50 100 41 69 15 85 31 59 0 50 31 41 15 15 41 31Z" />
    </svg>
  );
}
