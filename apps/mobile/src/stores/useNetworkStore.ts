import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

const MAINTENANCE = process.env.EXPO_PUBLIC_MAINTENANCE_MODE === 'true';

type NetworkState = {
  isOffline: boolean;
  isMaintenance: boolean;
  init: () => () => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isOffline: false,
  isMaintenance: MAINTENANCE,
  init: () => {
    const unsub = NetInfo.addEventListener((state) => {
      set({ isOffline: state.isConnected === false });
    });
    return unsub;
  },
}));
