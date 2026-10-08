"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearCart } from "@/lib/cart-store";
import { createOrderAction } from "@/app/actions/orders";

type CheckoutState = {
  error?: string;
  fieldErrors?: string[];
  orderId?: string;
};

const initialState: CheckoutState = {};

export default function CheckoutForm({
  initialItems,
}: {
  initialItems: { dishId: string; quantity: number }[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    createOrderAction,
    initialState
  );

  useEffect(() => {
    if (state.orderId) {
      clearCart();
      router.replace(`/orders/${state.orderId}`);
    }
  }, [router, state.orderId]);

  return (
    <form action={action} className="mt-6">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(initialItems)}
      />
      {state.error && (
        <p role="alert" className="mb-4 text-red-700">
          {state.error}
        </p>
      )}
      {state.fieldErrors?.map((error) => (
        <p key={error} role="alert" className="mb-2 text-red-700">
          {error}
        </p>
      ))}
      <button
        type="submit"
        disabled={pending || initialItems.length === 0}
        className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Placing order..." : "Place order"}
      </button>
    </form>
  );
}
