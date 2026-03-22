import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createCheckinRequest, buildCheckinUrl } from "@/lib/checkins";
import { getEnv } from "@/lib/env";
import { hashToken } from "@/lib/tokens";

type RouteProps = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, { params }: RouteProps): Promise<NextResponse> {
  const env = getEnv();
  const { token } = await params;
  const participant = await db.participant.findFirst({
    where: { manualAccessTokenHash: hashToken(token), active: true },
  });

  if (!participant) {
    return NextResponse.json({ error: "Invalid manual access token." }, { status: 404 });
  }

  const { rawToken } = await createCheckinRequest({
    participantId: participant.id,
    source: "MANUAL",
    expiresInHours: 2,
  });

  return NextResponse.redirect(buildCheckinUrl(rawToken, env.APP_BASE_URL));
}
