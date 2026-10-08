import { NextResponse } from "next/server";
import { getDishById } from "@/lib/data";

type DishRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: DishRouteContext
) {
  const { id } = await params;
  const dish = await getDishById(id);

  if (!dish) {
    return NextResponse.json(
      { error: "Dish not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(dish);
}
