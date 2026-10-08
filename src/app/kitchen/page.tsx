import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import KitchenOrderControls from "./KitchenOrderControls";
import { getAllOrdersForStaff } from "@/lib/orders";
import { getSession } from "@/lib/session";
import SignOutButton from "@/app/SignOutButton";

export const metadata: Metadata = {
  title: "Kitchen",
  robots: { index: false, follow: false },
};

export default async function KitchenPage() {
  const session = await getSession();
  if (!session) {
    redirect("/signin?next=%2Fkitchen");
  }
  if (session.role !== "staff") {
    notFound();
  }

  const orders = getAllOrdersForStaff();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold">Kitchen Orders</h1>
          <SignOutButton />
        </div>
        {orders.length === 0 ? (
          <p className="rounded-xl bg-white p-8">No orders yet.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="rounded-xl bg-white p-6">
                <p className="font-semibold">{order.customerName}</p>
                <p className="mt-1 break-all text-sm text-gray-600">
                  {order.id}
                </p>
                <p className="mt-2 capitalize">Status: {order.status}</p>
                <ul className="mt-3 list-inside list-disc">
                  {order.items.map((item) => (
                    <li key={item.dishId}>
                      {item.dishName} × {item.quantity}
                    </li>
                  ))}
                </ul>
                {order.status !== "cancelled" &&
                  order.status !== "ready" && (
                    <KitchenOrderControls orderId={order.id} />
                  )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
