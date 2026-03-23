import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { requireAdminOr401 } from "@/lib/admin";
import { buildCheckinUrl, createCheckinRequest } from "@/lib/checkins";
import { sendCheckinSms } from "@/lib/sms";

export async function POST(request: Request): Promise<NextResponse> {
  const env = getEnv();
  const authError = await requireAdminOr401();
  if (authError) {
    return authError;
  }

  const formData = await request.formData();
  const participantId = String(formData.get("participantId") ?? "");
  if (!participantId) {
    return NextResponse.redirect(new URL("/?error=participant", request.url));
  }

  const participant = await db.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant) {
    return NextResponse.redirect(new URL("/?error=participant", request.url));
  }

  const { rawToken } = await createCheckinRequest({
    participantId: participant.id,
    source: "MANUAL",
  });

  await sendCheckinSms({
    to: participant.phone,
    participantName: participant.name,
    checkinUrl: buildCheckinUrl(rawToken, env.APP_BASE_URL),
  });

  return NextResponse.redirect(new URL("/?sentNow=1", request.url));
}
