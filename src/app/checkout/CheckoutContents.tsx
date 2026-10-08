"use client";

import Link from "next/link";
import { useCart } from "@/app/cart/CartProvider";
import { DELIVERY_FEE } from "@/lib/pricing";
import type { Dish } from "@/lib/data";
import CheckoutForm from "./CheckoutForm";

export default function CheckoutContents({
  dishes,
}: {
  dishes: Dish[];
}) {
  const { items, error } = useCart();
  const dishById = new Map(dishes.map((dish) => [dish.id, dish]));
  const cartItems = items.flatMap((item) => {
    const dish = dishById.get(item.dishId);
    return dish ? [{ ...item, dish }] : [];
  });
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0
  );

  return (
    <section className="rounded-xl bg-white p-6">
      {error && (
        <p role="alert" className="mb-4 text-red-700">
          {error}
        </p>
      )}
      {cartItems.length === 0 ? (
        <div>
          <p>Your cart is empty.</p>
          <Link href="/menu" className="mt-2 inline-block text-orange-700">
            Return to the menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {cartItems.map(({ dish, quantity }) => (
              <li key={dish.id} className="flex justify-between">
                <span>
                  {dish.name} × {quantity}
                </span>
                <span>{dish.price * quantity} ETB</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2 border-t pt-4">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{subtotal} ETB</span>
            </p>
            <p className="flex justify-between">
              <span>Delivery</span>
              <span>{DELIVERY_FEE} ETB</span>
            </p>
            <p className="flex justify-between font-bold">
              <span>Total</span>
              <span>{subtotal + DELIVERY_FEE} ETB</span>
            </p>
          </div>
          <CheckoutForm
            initialItems={cartItems.map(({ dish, quantity }) => ({
              dishId: dish.id,
              quantity,
            }))}
          />
        </>
      )}
    </section>
  );
}
