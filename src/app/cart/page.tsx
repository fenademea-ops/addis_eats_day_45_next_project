import type { Metadata } from "next";
import { getDishes } from "@/lib/data";
import CartContents from "./CartContents";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const dishes = await getDishes();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">Your Cart</h1>
        <CartContents dishes={dishes} />
      </div>
    </main>
  );
}
