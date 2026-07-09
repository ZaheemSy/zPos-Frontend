import { create } from 'zustand';

interface ConnectivityState {
  isOnline: boolean;
  setOnline: (value: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: navigator.onLine,
  setOnline: (value) => set({ isOnline: value }),
}));

export function initConnectivityListeners() {
  window.addEventListener('online', () => useConnectivityStore.getState().setOnline(true));
  window.addEventListener('offline', () => useConnectivityStore.getState().setOnline(false));
}
