"use client";

import { useState } from "react";
import { useCart } from "@/app/cart/CartProvider";

export default function AddToCartButton({
  dishId,
}: {
  dishId: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add(dishId);
        setAdded(true);
      }}
      className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
    >
      {added ? "Added to Cart" : "Add to Cart"}
    </button>
  );
}
