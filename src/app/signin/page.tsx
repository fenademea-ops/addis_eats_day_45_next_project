import type { Metadata } from "next";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import SignInForm from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

type SignInPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const params = await searchParams;
  const nextParam = Array.isArray(params.next)
    ? params.next[0]
    : params.next;
  const next = getSafeRedirectPath(nextParam);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="font-semibold text-orange-600">ADDIS EATS</p>
        <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-gray-600">
          Use a demo account to continue.
        </p>
        <SignInForm next={next} />
      </section>
    </main>
  );
}
