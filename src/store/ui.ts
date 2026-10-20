import { create } from "zustand";

interface UIState {
  cartOpen: boolean;
  authModalOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  authModalOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
}));
