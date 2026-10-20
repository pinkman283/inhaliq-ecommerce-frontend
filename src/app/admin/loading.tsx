export default function AdminLoading() {
  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* Top Header Placeholder */}
      <div className="h-14 w-full bg-[#11141D] border border-[#272B35] rounded-xl animate-pulse" />

      {/* Metric Cards Row Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-[#11141D] border border-[#272B35] animate-pulse"
          />
        ))}
      </div>

      {/* Main Content Area Placeholder */}
      <div className="h-96 w-full rounded-xl bg-[#11141D] border border-[#272B35] animate-pulse" />
    </div>
  );
}
