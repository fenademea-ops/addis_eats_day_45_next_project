"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateKitchenOrderAction,
  type KitchenActionState,
} from "@/app/actions/orders";

const initialState: KitchenActionState = {};

export default function KitchenOrderControls({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    updateKitchenOrderAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={action} className="mt-4 flex flex-wrap gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <button
        name="status"
        value="preparing"
        disabled={pending}
        className="rounded-lg border px-3 py-2 disabled:opacity-50"
      >
        Mark preparing
      </button>
      <button
        name="status"
        value="ready"
        disabled={pending}
        className="rounded-lg bg-orange-600 px-3 py-2 text-white disabled:opacity-50"
      >
        Mark ready
      </button>
      {state.error && (
        <p role="alert" className="w-full text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
