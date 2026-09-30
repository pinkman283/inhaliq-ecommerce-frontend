import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@/types";
import { api } from "@/lib/api";

interface WishlistState {
  items: Product[];
  isWishlistOpen: boolean;
  isLoading: boolean;
  
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlistDrawer: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
  mergeWithServerWishlist: () => Promise<void>;
  fetchServerWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isWishlistOpen: false,
      isLoading: false,

      openWishlist: () => set({ isWishlistOpen: true }),
      closeWishlist: () => set({ isWishlistOpen: false }),
      toggleWishlistDrawer: () => set((state) => ({ isWishlistOpen: !state.isWishlistOpen })),

      toggleWishlist: (product: Product) => {
        set((state) => {
          const exists = state.items.some((item) => item.id === product.id);
          const updatedItems = exists
            ? state.items.filter((item) => item.id !== product.id)
            : [...state.items, product];

          // If authenticated customer, synchronize with backend
          if (typeof window !== "undefined") {
            const token = localStorage.getItem("auth_token");
            if (token) {
              api.toggleCustomerWishlist(product.id).catch((err) => {
                console.warn("Wishlist sync notice:", err);
              });
            }
          }

          return { items: updatedItems };
        });
      },

      isInWishlist: (productId: number) => {
        return get().items.some((item) => item.id === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("auth_token");
          if (token) {
            api.clearCustomerWishlist().catch(() => {});
          }
        }
      },

      mergeWithServerWishlist: async () => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        set({ isLoading: true });
        try {
          const guestProductIds = get().items.map((p) => p.id);
          const res = await api.mergeCustomerWishlist(guestProductIds);
          if (res?.products) {
            set({ items: res.products });
          }
        } catch (error) {
          console.warn("Failed to merge wishlist with server:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchServerWishlist: async () => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        set({ isLoading: true });
        try {
          const res = await api.getCustomerWishlist();
          if (res?.products) {
            set({ items: res.products });
          }
        } catch (error) {
          console.warn("Failed to fetch server wishlist:", error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "ecom_wishlist_storage_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
