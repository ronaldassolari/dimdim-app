export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
