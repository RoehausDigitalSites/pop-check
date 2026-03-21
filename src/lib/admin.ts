import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

export async function requireAdminOr401(): Promise<NextResponse | null> {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
