import { Suspense } from "react";
import type { Metadata } from "next";
import { getDishes } from "@/lib/data";
import MenuBrowser from "./MenuBrowser";

export const metadata: Metadata = {
  title: "Menu",
  description: "Browse and search Ethiopian dishes at Addis Eats.",
};

export default async function MenuPage() {
  const dishes = await getDishes();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="font-semibold text-orange-600">
            ADDIS EATS
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Our Menu
          </h1>

          <p className="mt-3 text-gray-600">
            Discover delicious Ethiopian dishes made with
            traditional flavors.
          </p>
        </div>

        <Suspense fallback={null}>
          <MenuBrowser initialDishes={dishes} />
        </Suspense>
      </div>
    </main>
  );
}