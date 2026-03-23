import { NextResponse } from "next/server";
import { setAdminAuthCookie } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData();
  const passphrase = formData.get("passphrase");

  if (typeof passphrase !== "string") {
    return NextResponse.redirect(new URL("/?error=invalid", request.url));
  }

  const ok = await setAdminAuthCookie(passphrase);
  if (!ok) {
    return NextResponse.redirect(new URL("/?error=invalid", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
