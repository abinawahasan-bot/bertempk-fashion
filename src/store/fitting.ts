import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Gender, Product } from "../types";

/**
 * Fitting room state.
 *
 * `picks` is the list of pieces currently worn by the model. Adding a piece
 * flips `status` to "dressing" so the panel can show the
 * "Dressing your model — the photo is being made for you" state before the
 * piece settles onto the body.
 */

export type FittingStatus = "idle" | "dressing";

interface FittingState {
  open: boolean;
  /** Which rigged body the stage dresses. */
  gender: Gender;
  picks: Product[];
  /** Chosen colourway index per product id (see `colorsFor`). */
  colors: Record<string, number>;
  /** Chosen size per product id (see `SIZES`). */
  sizes: Record<string, string>;
  status: FittingStatus;
  openRoom: () => void;
  closeRoom: () => void;
  /** Swaps the mannequin body. */
  setGender: (gender: Gender) => void;
  /** Wears / removes a piece. Returns true when it was worn. */
  togglePick: (product: Product) => boolean;
  removePick: (id: string) => void;
  /** Picks a colourway for one worn piece. */
  setColor: (id: string, index: number) => void;
  /** Picks a size for one worn piece. */
  setSize: (id: string, size: string) => void;
  startOver: () => void;
  /** Called once the dressing animation has finished. */
  settle: () => void;
}

export const DRESSING_MS = 1500;

export const useFittingStore = create<FittingState>()(
  persist(
    (set, get) => ({
      open: false,
      gender: "male",
      picks: [],
      colors: {},
      sizes: {},
      status: "idle",

      openRoom: () => set({ open: true }),
      closeRoom: () => set({ open: false }),

      setGender: (gender) => set({ gender }),

      togglePick: (product) => {
        const worn = get().picks.some((p) => p.id === product.id);
        if (worn) {
          set({ picks: get().picks.filter((p) => p.id !== product.id) });
          return false;
        }
        set({ picks: [...get().picks, product], status: "dressing", open: true });
        return true;
      },

      removePick: (id) =>
        set((s) => {
          const colors = { ...s.colors };
          const sizes = { ...s.sizes };
          delete colors[id];
          delete sizes[id];
          return {
            picks: s.picks.filter((p) => p.id !== id),
            colors,
            sizes,
          };
        }),

      setColor: (id, index) =>
        set((s) => ({ colors: { ...s.colors, [id]: index } })),

      setSize: (id, size) => set((s) => ({ sizes: { ...s.sizes, [id]: size } })),

      startOver: () => set({ picks: [], colors: {}, sizes: {}, status: "idle" }),

      settle: () => set({ status: "idle" }),
    }),
    {
      name: "bato-fitting",
      partialize: (state) => ({
        gender: state.gender,
        picks: state.picks,
        colors: state.colors,
        sizes: state.sizes,
      }),
    }
  )
);
