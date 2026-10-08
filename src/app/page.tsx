import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-5xl font-bold text-orange-600">
          Addis Eats
        </h1>

        <p className="mt-4 text-xl text-gray-600">
          Delicious Ethiopian food, delivered to you.
        </p>

        <div className="mt-8">
          <Link
            href="/menu"
            className="inline-block rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700"
          >
            Explore Menu
          </Link>
        </div>
      </div>
    </main>
  );
}