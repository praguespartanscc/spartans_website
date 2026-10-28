type SkeletonListProps = {
  rows?: number;
  height?: number;
  label?: string;
};

// Shimmering placeholders shown while data loads, instead of a spinner.
export function SkeletonList({ rows = 3, height = 92, label = 'Loading' }: SkeletonListProps) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ items = 3, height = 220, label = 'Loading' }: { items?: number; height?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}
