import type { Metadata } from "next";
import { getDishes } from "@/lib/data";
import CheckoutContents from "./CheckoutContents";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const dishes = await getDishes();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-4xl font-bold">Checkout</h1>
        <CheckoutContents dishes={dishes} />
      </div>
    </main>
  );
}
