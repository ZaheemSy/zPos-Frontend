import { WifiOff } from 'lucide-react';
import { useConnectivityStore } from '../utils/connectivity';

export default function ConnectivityBanner() {
  const isOnline = useConnectivityStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white"
    >
      <WifiOff size={16} />
      No internet connection. Please check your connection and try again.
    </div>
  );
}
