"use client";

export type CartLine = {
  dishId: string;
  quantity: number;
};

export type CartSnapshot = {
  items: CartLine[];
  error?: string;
};

const emptySnapshot: CartSnapshot = { items: [] };
const storageKey = "addis-eats-cart";
const changeEvent = "addis-eats-cart-change";
let cachedRaw: string | null | undefined;
let cachedSnapshot = emptySnapshot;
const listeners = new Set<() => void>();

function readSnapshot(): CartSnapshot {
  if (typeof window === "undefined") {
    return emptySnapshot;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = emptySnapshot;
    return cachedSnapshot;
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (
      !Array.isArray(value) ||
      value.some(
        (item) =>
          !item ||
          typeof item.dishId !== "string" ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 20
      )
    ) {
      throw new Error("Saved cart has an invalid format.");
    }

    cachedSnapshot = { items: value as CartLine[] };
  } catch {
    cachedSnapshot = {
      items: [],
      error: "Saved cart data is invalid. Clear it before continuing.",
    };
  }

  return cachedSnapshot;
}

export function subscribeToCart(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener(changeEvent, listener);
    window.addEventListener("storage", listener);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener(changeEvent, listener);
      window.removeEventListener("storage", listener);
    }
  };
}

export function getCartSnapshot() {
  return readSnapshot();
}

export function getServerCartSnapshot() {
  return emptySnapshot;
}

function writeCart(items: CartLine[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items));
  cachedRaw = undefined;
  window.dispatchEvent(new Event(changeEvent));
}

export function addCartItem(dishId: string) {
  const current = readSnapshot().items;
  const existing = current.find((item) => item.dishId === dishId);
  const items = existing
    ? current.map((item) =>
        item.dishId === dishId
          ? { ...item, quantity: Math.min(20, item.quantity + 1) }
          : item
      )
    : [...current, { dishId, quantity: 1 }];
  writeCart(items);
}

export function setCartItemQuantity(
  dishId: string,
  quantity: number
) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 20) {
    return;
  }

  const items = readSnapshot().items
    .map((item) =>
      item.dishId === dishId ? { ...item, quantity } : item
    )
    .filter((item) => item.quantity > 0);
  writeCart(items);
}

export function removeCartItem(dishId: string) {
  writeCart(
    readSnapshot().items.filter((item) => item.dishId !== dishId)
  );
}

export function clearCart() {
  writeCart([]);
}
