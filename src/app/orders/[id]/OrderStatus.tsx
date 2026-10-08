"use client";

import useSWR from "swr";
import { useActionState } from "react";
import { fetcher } from "@/lib/fetcher";
import {
  cancelOrderAction,
  type CancelOrderState,
} from "@/app/actions/orders";
import type { Order } from "@/lib/orders";

const initialState: CancelOrderState = {};

export default function OrderStatus({
  initialOrder,
}: {
  initialOrder: Order;
}) {
  const { data, error } = useSWR<Order>(
    `/api/orders/${encodeURIComponent(initialOrder.id)}`,
    fetcher,
    {
      fallbackData: initialOrder,
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelOrderAction,
    initialState
  );
  const order = data ?? initialOrder;

  return (
    <section className="mt-6 rounded-xl bg-white p-6">
      {error && (
        <p role="alert" className="mb-4 text-red-700">
          Could not refresh the order status.
        </p>
      )}
      <p>
        Status: <strong className="capitalize">{order.status}</strong>
      </p>
      <p className="mt-2">Total: {order.total} ETB</p>
      <ul className="mt-4 list-inside list-disc">
        {order.items.map((item) => (
          <li key={item.dishId}>
            {item.dishName} × {item.quantity}
          </li>
        ))}
      </ul>
      {order.status === "received" && (
        <form action={cancelAction} className="mt-6">
          <input type="hidden" name="orderId" value={order.id} />
          {cancelState.error && (
            <p role="alert" className="mb-3 text-red-700">
              {cancelState.error}
            </p>
          )}
          {cancelState.success ? (
            <p role="status" className="text-green-700">
              Order cancelled.
            </p>
          ) : (
            <button
              type="submit"
              disabled={cancelPending}
              className="rounded-lg border border-red-700 px-4 py-2 text-red-700 disabled:opacity-50"
            >
              {cancelPending ? "Cancelling..." : "Cancel order"}
            </button>
          )}
        </form>
      )}
    </section>
  );
}
