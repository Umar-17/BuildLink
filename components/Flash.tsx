"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

/** Toast: Reads ?error= / ?ok= from server action redirects, displays with monochrome vector icons, then cleans URL. */
export default function Flash({ error, ok }: { error?: string; ok?: string }) {
  const message = error ?? ok;
  const [shown, setShown] = useState<string | undefined>(message);

  useEffect(() => {
    if (!message) return;
    setShown(message);
    const url = new URL(window.location.href);
    if (url.searchParams.has("error") || url.searchParams.has("ok")) {
      url.searchParams.delete("error");
      url.searchParams.delete("ok");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    const t = setTimeout(() => setShown(undefined), error ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [message, error]);

  if (!shown) return null;
  const bad = Boolean(error);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        role={bad ? "alert" : "status"}
        style={{ animation: "toast-in .2s ease-out" }}
        className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-md backdrop-blur-md ${
          bad ? "border-bad/30 bg-bad-soft text-bad" : "border-good/30 bg-good-soft text-good"
        }`}
      >
        {bad ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-bad" strokeWidth={2} />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-good" strokeWidth={2} />
        )}
        <span className="flex-1 text-xs sm:text-sm font-medium">{shown}</span>
        <button
          onClick={() => setShown(undefined)}
          aria-label="Dismiss"
          className="rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
