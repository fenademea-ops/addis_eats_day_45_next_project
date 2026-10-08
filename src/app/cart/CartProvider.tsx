"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
} from "react";
import {
  addCartItem,
  getCartSnapshot,
  getServerCartSnapshot,
  removeCartItem,
  setCartItemQuantity,
  subscribeToCart,
  type CartSnapshot,
} from "@/lib/cart-store";

type CartContextValue = CartSnapshot & {
  add: typeof addCartItem;
  remove: typeof removeCartItem;
  setQuantity: typeof setCartItemQuantity;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const snapshot = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getServerCartSnapshot
  );

  return (
    <CartContext.Provider
      value={{
        ...snapshot,
        add: addCartItem,
        remove: removeCartItem,
        setQuantity: setCartItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return cart;
}
