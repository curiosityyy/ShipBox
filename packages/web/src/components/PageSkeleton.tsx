export function PageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title skeleton */}
      <div className="skeleton h-7 w-32" />

      {/* Stat cards */}
      {cards > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cards}, minmax(0, 1fr))`, gap: "1rem" }}>
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl px-4 py-4">
              <div className="skeleton h-8 w-16 mx-auto mb-2" />
              <div className="skeleton h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Content skeleton */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="skeleton h-4 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
