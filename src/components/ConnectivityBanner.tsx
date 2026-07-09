import { useConnectivityStore } from '../utils/connectivity';

export default function ConnectivityBanner() {
  const isOnline = useConnectivityStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      style={{
        background: '#c0392b',
        color: 'white',
        textAlign: 'center',
        padding: '8px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        fontSize: 14,
      }}
    >
      No internet connection. Please check your connection and try again.
    </div>
  );
}
