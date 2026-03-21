import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";

const ADMIN_COOKIE_KEY = "emotion_admin";

export async function isAdminAuthenticated(): Promise<boolean> {
  const env = getEnv();
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_KEY)?.value === env.ADMIN_PASSPHRASE;
}

export async function setAdminAuthCookie(passphrase: string): Promise<boolean> {
  const env = getEnv();
  if (passphrase !== env.ADMIN_PASSPHRASE) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_KEY, passphrase, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
  });

  return true;
}
