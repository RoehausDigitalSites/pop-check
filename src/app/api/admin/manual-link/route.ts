import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildManualAccessUrl } from "@/lib/checkins";
import { getEnv } from "@/lib/env";
import { requireAdminOr401 } from "@/lib/admin";
import { createManualAccessToken } from "@/lib/tokens";

export async function POST(request: Request): Promise<NextResponse> {
  const env = getEnv();
  const authError = await requireAdminOr401();
  if (authError) {
    return authError;
  }

  const formData = await request.formData();
  const participantId = String(formData.get("participantId") ?? "");
  if (!participantId) {
    return NextResponse.redirect(new URL("/admin?error=participant", request.url));
  }

  const { rawToken, tokenHash } = createManualAccessToken();
  await db.participant.update({
    where: { id: participantId },
    data: { manualAccessTokenHash: tokenHash },
  });

  const url = new URL("/admin", request.url);
  url.searchParams.set("manualUrl", buildManualAccessUrl(rawToken, env.APP_BASE_URL));

  return NextResponse.redirect(url);
}
