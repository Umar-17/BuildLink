import Nav from "@/components/Nav";

export const Sk = ({ className = "" }: { className?: string }) => (
  <div aria-hidden className={`animate-pulse rounded-xl bg-elevated border border-line/40 ${className}`} />
);

/** Used by loading.tsx files so navigation feels instant and matches BuildLink theme. */
export function PageSkeleton({ variant = "grid" }: { variant?: "grid" | "detail" }) {
  return (
    <>
      <Nav user={null} skeleton />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading">
        <Sk className="h-8 w-56" />
        {variant === "detail" ? (
          <>
            <Sk className="h-44 w-full rounded-2xl" />
            <Sk className="h-6 w-40" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Sk key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Sk key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Sk key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
