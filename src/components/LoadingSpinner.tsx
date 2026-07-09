export default function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, color: '#888' }}>
      <span
        style={{
          width: 14,
          height: 14,
          border: '2px solid #444',
          borderTopColor: '#4f8ef7',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'zpos-spin 0.7s linear infinite',
        }}
      />
      {label}
      <style>
        {`@keyframes zpos-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
}
