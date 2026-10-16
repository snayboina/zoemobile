import { create } from 'zustand';

interface AppState {
  isOffline: boolean;
  setOfflineStatus: (status: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOffline: false,
  setOfflineStatus: (status) => set({ isOffline: status }),
}));
