import { Link, useLocation } from "@remix-run/react";
import type { ReactNode } from "react";

// Let the router own fragment history and scrolling so restoration cannot
// override a native anchor jump. Preserve query parameters on the current page.
export function SectionLink({
  targetId,
  className,
  children,
}: {
  targetId: string;
  className?: string;
  children: ReactNode;
}) {
  const { search } = useLocation();
  return (
    <Link
      to={{ search, hash: `#${targetId}` }}
      className={className}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !event.shiftKey
        ) {
          document.getElementById(targetId)?.focus({ preventScroll: true });
        }
      }}
    >
      {children}
    </Link>
  );
}
