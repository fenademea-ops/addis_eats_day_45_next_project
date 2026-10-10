import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrderForUser } from "@/lib/orders";
import { getSession } from "@/lib/session";
import OrderStatus from "./OrderStatus";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: OrderPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/signin?next=%2Forders");
  }

  const { id } = await params;
  const order = await getOrderForUser(session.userId, id);
  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/orders"
          className="font-semibold text-orange-700"
        >
          ← All orders
        </Link>
        <h1 className="mt-5 text-4xl font-bold">Order details</h1>
        <p className="mt-2 break-all text-gray-600">{order.id}</p>
        <OrderStatus initialOrder={order} />
      </div>
    </main>
  );
}
