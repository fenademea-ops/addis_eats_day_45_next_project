import { NextRequest, NextResponse } from "next/server";
import { getDishes } from "@/lib/data";

const PAGE_SIZE = 6;

export async function GET(request: NextRequest) {
  const dishes = await getDishes();

  const searchParams = request.nextUrl.searchParams;

  const search = searchParams.get("search")?.trim().toLowerCase() || "";

  const pageParam = Number(searchParams.get("page") || "1");

  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const filteredDishes = search
    ? dishes.filter((dish) => {
        return (
          dish.name.toLowerCase().includes(search) ||
          dish.category.toLowerCase().includes(search) ||
          dish.description.toLowerCase().includes(search)
        );
      })
    : dishes;

  const total = filteredDishes.length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const items = filteredDishes.slice(start, end);

  return NextResponse.json({
    items,
    total,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalPages,
  });
}