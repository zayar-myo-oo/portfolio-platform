/** Instant skeleton while an admin page's (uncached) data loads. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-8 border-b border-line pb-6">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-4 h-9 w-64" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
