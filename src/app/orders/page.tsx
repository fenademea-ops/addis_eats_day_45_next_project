import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrdersForUser } from "@/lib/orders";
import { getSession } from "@/lib/session";
import SignOutButton from "@/app/SignOutButton";

export const metadata: Metadata = {
  title: "Your Orders",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/signin?next=%2Forders");
  }

  const orders = getOrdersForUser(session.userId);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold">Your Orders</h1>
          <SignOutButton />
        </div>
        {orders.length === 0 ? (
          <section className="rounded-xl bg-white p-8">
            <p>You have not placed an order yet.</p>
            <Link
              href="/menu"
              className="mt-4 inline-block font-semibold text-orange-700"
            >
              Browse the menu
            </Link>
          </section>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="rounded-xl bg-white p-6">
                <Link
                  href={`/orders/${order.id}`}
                  className="font-semibold text-orange-700"
                >
                  Order {order.id}
                </Link>
                <p className="mt-2">
                  Status: <span className="capitalize">{order.status}</span>
                </p>
                <p>Total: {order.total} ETB</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
