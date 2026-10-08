"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";

type Dish = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
};

type DishesResponse = {
  items: Dish[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type MenuBrowserProps = {
  initialDishes: Dish[];
};

export default function MenuBrowser({
  initialDishes,
}: MenuBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const [search, setSearch] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] =
    useState(searchParam);
  const previousSearch = useRef(search);

  useEffect(() => {
    const url = new URLSearchParams();
    if (searchParam) {
      url.set("search", searchParam);
    }
    url.set("page", String(page));
    const expectedSearch = url.toString();

    if (searchParams.toString() !== expectedSearch) {
      router.replace(`/menu?${expectedSearch}`, {
        scroll: false,
      });
    }
  }, [page, router, searchParam, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());

      if (search !== previousSearch.current) {
        previousSearch.current = search;
        const params = new URLSearchParams();
        if (search.trim()) {
          params.set("search", search.trim());
        }
        params.set("page", "1");
        router.replace(`/menu?${params.toString()}`, {
          scroll: false,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [router, search]);

  const query = debouncedSearch
    ? `/api/dishes?search=${encodeURIComponent(
        debouncedSearch
      )}&page=${page}`
    : `/api/dishes?page=${page}`;

  const swrKey = !debouncedSearch && page === 1 ? null : query;
  const initialResponse: DishesResponse = {
    items: initialDishes.slice(0, 6),
    total: initialDishes.length,
    page: 1,
    pageSize: 6,
    totalPages: Math.max(
      1,
      Math.ceil(initialDishes.length / 6)
    ),
  };

  const { data, error, isLoading, isValidating } =
    useSWR<DishesResponse>(swrKey, fetcher, {
      fallbackData: initialResponse,
      keepPreviousData: true,
    });

  if (error) {
    return (
      <p className="rounded-lg bg-red-100 p-4 text-red-700">
        Failed to load dishes.
      </p>
    );
  }

  const visibleData =
    !debouncedSearch && page === 1 ? initialResponse : data;
  const dishes = visibleData?.items ?? [];

  return (
    <div>
      <div className="mb-8">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search dishes..."
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      </div>

      {isValidating && (
        <p className="mb-4 text-sm text-gray-500">
          Updating results...
        </p>
      )}

      {isLoading && !data ? (
        <p className="text-gray-600">Loading dishes...</p>
      ) : dishes.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-gray-600">
          No dishes found.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish, index) => (
            <article
              key={dish.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-48 bg-orange-100">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  width={600}
                  height={400}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={index === 0}
                  loading={index < 2 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6">
                <p className="text-sm font-semibold text-orange-600">
                  {dish.category}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {dish.name}
                </h2>

                <p className="mt-3 line-clamp-2 text-gray-600">
                  {dish.description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xl font-bold">
                    {dish.price} ETB
                  </span>

                  <Link
                    href={`/menu/${dish.id}`}
                    className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
                  >
                    View Dish
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {visibleData && visibleData.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => {
              const nextPage = page - 1;
              const params = new URLSearchParams();
              if (debouncedSearch) {
                params.set("search", debouncedSearch);
              }
              params.set("page", String(nextPage));
              router.push(`/menu?${params.toString()}`, {
                scroll: false,
              });
            }}
            className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="font-medium">
            Page {visibleData.page} of {visibleData.totalPages}
          </span>

          <button
            type="button"
            disabled={page === visibleData.totalPages}
            onClick={() => {
              const nextPage = page + 1;
              const params = new URLSearchParams();
              if (debouncedSearch) {
                params.set("search", debouncedSearch);
              }
              params.set("page", String(nextPage));
              router.push(`/menu?${params.toString()}`, {
                scroll: false,
              });
            }}
            className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}