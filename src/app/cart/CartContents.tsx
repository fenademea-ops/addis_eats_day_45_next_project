"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { DELIVERY_FEE } from "@/lib/pricing";
import type { Dish } from "@/lib/data";

export default function CartContents({
  dishes,
}: {
  dishes: Dish[];
}) {
  const { items, error, remove, setQuantity } = useCart();
  const dishById = new Map(dishes.map((dish) => [dish.id, dish]));
  const cartItems = items.flatMap((item) => {
    const dish = dishById.get(item.dishId);
    return dish ? [{ ...item, dish }] : [];
  });
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0
  );
  const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0;

  return (
    <section>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-100 p-4 text-red-800">
          {error}
        </p>
      )}
      {cartItems.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center">
          <p className="text-gray-600">Your cart is empty.</p>
          <Link
            href="/menu"
            className="mt-4 inline-block font-semibold text-orange-600"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {cartItems.map(({ dish, quantity }) => (
              <li
                key={dish.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5"
              >
                <div>
                  <h2 className="font-bold">{dish.name}</h2>
                  <p className="text-gray-600">{dish.price} ETB each</p>
                </div>
                <label className="flex items-center gap-2">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        dish.id,
                        Number(event.target.value)
                      )
                    }
                    className="w-20 rounded border px-2 py-1"
                  />
                </label>
                <p className="font-semibold">
                  {dish.price * quantity} ETB
                </p>
                <button
                  type="button"
                  onClick={() => remove(dish.id)}
                  className="font-medium text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 ml-auto max-w-sm space-y-2 rounded-xl bg-white p-6">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{subtotal} ETB</span>
            </p>
            <p className="flex justify-between">
              <span>Delivery</span>
              <span>{DELIVERY_FEE} ETB</span>
            </p>
            <p className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total</span>
              <span>{total} ETB</span>
            </p>
            <Link
              href="/checkout"
              className="mt-4 block rounded-lg bg-orange-600 px-4 py-3 text-center font-semibold text-white"
            >
              Continue to checkout
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
