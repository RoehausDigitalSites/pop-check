import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOr401 } from "@/lib/admin";

export async function POST(request: Request): Promise<NextResponse> {
  const authError = await requireAdminOr401();
  if (authError) {
    return authError;
  }

  const formData = await request.formData();
  const participantId = String(formData.get("participantId") ?? "");
  const dailyTimeLocal = String(formData.get("dailyTimeLocal") ?? "18:00");
  const timezone = String(formData.get("timezone") ?? "America/Los_Angeles");
  const reminderEnabled = formData.get("reminderEnabled") === "on";

  if (!participantId) {
    return NextResponse.redirect(new URL("/admin?error=participant", request.url));
  }

  await db.scheduleSetting.upsert({
    where: { participantId },
    create: {
      participantId,
      dailyTimeLocal,
      timezone,
      reminderEnabled,
    },
    update: {
      dailyTimeLocal,
      timezone,
      reminderEnabled,
    },
  });

  await db.participant.update({
    where: { id: participantId },
    data: { timezone },
  });

  return NextResponse.redirect(new URL("/admin?saved=schedule", request.url));
}
