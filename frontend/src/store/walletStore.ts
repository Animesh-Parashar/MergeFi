import { create } from 'zustand';

interface WalletState {
    isConnected: boolean;
    address: string | null;
    chainId: number | null;
    setWalletState: (state: Partial<WalletState>) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
    isConnected: false,
    address: null,
    chainId: null,
    setWalletState: (state) => set((prev) => ({ ...prev, ...state })),
}));