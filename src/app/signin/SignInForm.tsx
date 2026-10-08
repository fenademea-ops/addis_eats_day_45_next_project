"use client";

import { useActionState } from "react";
import {
  signInAction,
  type SignInState,
} from "@/app/actions/auth";

const initialState: SignInState = {};

export default function SignInForm({
  next,
}: {
  next: string;
}) {
  const [state, action, pending] = useActionState(
    signInAction,
    initialState
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1 block font-medium">Email</span>
        <input
          required
          autoComplete="email"
          name="email"
          type="email"
          className="w-full rounded-lg border px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="mb-1 block font-medium">Password</span>
        <input
          required
          autoComplete="current-password"
          name="password"
          type="password"
          className="w-full rounded-lg border px-3 py-2"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
