import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { CartProvider } from "@/app/cart/CartProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Addis Eats",
    template: "%s | Addis Eats",
  },
  description:
    "Addis Eats - Discover and order delicious Ethiopian food.",
  openGraph: {
    type: "website",
    siteName: "Addis Eats",
    title: "Addis Eats",
    description: "Discover and order delicious Ethiopian food.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} min-h-screen bg-gray-50 text-gray-900`}
      >
        <header className="border-b bg-white shadow-sm">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-2xl font-bold text-orange-600"
            >
              Addis Eats
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/menu"
                className="font-medium hover:text-orange-600"
              >
                Menu
              </Link>

              <Link
                href="/orders"
                className="font-medium hover:text-orange-600"
              >
                Orders
              </Link>

              <Link
                href="/cart"
                className="font-medium hover:text-orange-600"
              >
                Cart
              </Link>

              <Link
                href="/kitchen"
                className="font-medium hover:text-orange-600"
              >
                Kitchen
              </Link>
            </div>
          </nav>
        </header>

        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}