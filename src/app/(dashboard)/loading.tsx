export default function DashboardLoading() {
  const skeletonStyle = (w: string | number, h: string | number): React.CSSProperties => ({
    width: w,
    height: h,
    borderRadius: 12,
    background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  });

  return (
    <div style={{ padding: '8px 0' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={skeletonStyle(200, 32)} />
        <div style={skeletonStyle(120, 40)} />
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ ...skeletonStyle('40%', 14), marginBottom: 12 }} />
            <div style={skeletonStyle('60%', 28)} />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <div style={{ ...skeletonStyle('30%', 16), marginBottom: 20 }} />
        <div style={skeletonStyle('100%', 200)} />
      </div>

      {/* List items */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ ...skeletonStyle('25%', 16), marginBottom: 20 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={skeletonStyle(44, 44)} />
              <div style={{ flex: 1 }}>
                <div style={{ ...skeletonStyle('50%', 14), marginBottom: 6 }} />
                <div style={skeletonStyle('30%', 12)} />
              </div>
              <div style={skeletonStyle(80, 20)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
