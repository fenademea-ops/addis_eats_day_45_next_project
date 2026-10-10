"use server";

import { scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  type Session,
} from "@/lib/session-token";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

export type SignInState = {
  error?: string;
};

export async function signInAction(
  _previousState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = getSafeRedirectPath(
    String(formData.get("next") ?? "")
  );

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    return { error: "Enter a valid email and password." };
  }

  const { rows } = await query<{
    id: string;
    email: string;
    name: string;
    role: "customer" | "staff";
    password_salt: string;
    password_hash: string;
  }>(
    `SELECT id, email, name, role, password_salt, password_hash
     FROM users WHERE email = ?`,
    [email]
  );
  const user = rows[0];

  if (!user) {
    return { error: "Email or password is incorrect." };
  }

  const suppliedHash = scryptSync(password, user.password_salt, 64);
  const storedHash = Buffer.from(user.password_hash, "hex");
  if (
    suppliedHash.length !== storedHash.length ||
    !timingSafeEqual(suppliedHash, storedHash)
  ) {
    return { error: "Email or password is incorrect." };
  }

  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    await createSessionToken(session),
    {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt * 1000),
    }
  );

  redirect(next);
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/");
}
