"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
  // Stock côté client pour empêcher d'incrémenter au-delà.
  // Re-vérifié côté serveur lors du checkout.
  stock?: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            const max = item.stock ?? Infinity;
            const next = Math.min(existing.quantity + qty, max);
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: next } : i,
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: qty }],
          };
        }),

      updateQuantity: (productId, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.productId !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.min(qty, i.stock ?? Infinity) }
                : i,
            ),
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "bonafone-cart",
      storage: createJSONStorage(() => localStorage),
      // On ne persiste que la liste, pas les actions évidemment
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

// Helpers selectors (évite les re-renders inutiles)
export const useCartCount = () =>
  useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));

export const useCartSubtotal = () =>
  useCart((s) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
