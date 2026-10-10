import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDishById } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";
import AddToCartButton from "./AddToCartButton";

type DishPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: DishPageProps): Promise<Metadata> {
  const { id } = await params;

  const dish = await getDishById(id);

  if (!dish) {
    return {
      title: "Dish Not Found",
      description: "The requested dish could not be found.",
    };
  }

  return {
    title: dish.name,
    description: `${dish.name} - ${dish.description} Price: ${dish.price} ETB.`,
    alternates: {
      canonical: new URL(`/menu/${dish.id}`, siteUrl),
    },
    openGraph: {
      type: "article",
      title: dish.name,
      description: dish.description,
      url: new URL(`/menu/${dish.id}`, siteUrl),
      images: [
        {
          url: `/menu/${dish.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${dish.name} from Addis Eats`,
        },
      ],
    },
  };
}

export default async function DishPage({
  params,
}: DishPageProps) {
  const { id } = await params;

  const dish = await getDishById(id);

  if (!dish) {
    notFound();
  }

  const dishImageUrl = new URL(dish.image, siteUrl).toString();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: dish.name,
    description: dish.description,
    image: dishImageUrl,
    offers: {
      "@type": "Offer",
      price: dish.price,
      priceCurrency: "ETB",
    },
    menuAddOn: dish.category,
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(
              /</g,
              "\\u003c"
            ),
          }}
        />
        <Link
          href="/menu"
          className="font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Back to Menu
        </Link>

        <article className="mt-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="h-72 bg-orange-100">
            <Image
              src={dish.image}
              alt={dish.name}
              width={1200}
              height={800}
              sizes="(max-width: 768px) 100vw, 896px"
              priority
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-8">
            <p className="font-semibold text-orange-600">
              {dish.category}
            </p>

            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              {dish.name}
            </h1>

            <p className="mt-4 text-lg leading-8 text-gray-600">
              {dish.description}
            </p>

            <div className="mt-8 flex items-center justify-between">
              <span className="text-3xl font-bold">
                {dish.price} ETB
              </span>

              <AddToCartButton dishId={dish.id} />
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}