"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Drop-in button for server-action forms with clean loading spinner state. */
export default function SubmitButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-60 transition-all`}
    >
      {pending && (
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin mr-2"
        />
      )}
      {children}
    </button>
  );
}
