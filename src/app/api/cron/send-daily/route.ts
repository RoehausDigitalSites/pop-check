import { formatInTimeZone } from "date-fns-tz";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { buildCheckinUrl, createCheckinRequest } from "@/lib/checkins";
import { sendCheckinSms } from "@/lib/sms";

function shouldSendNow(timezone: string, dailyTimeLocal: string): boolean {
  const nowLocal = formatInTimeZone(new Date(), timezone, "HH:mm");
  return nowLocal === dailyTimeLocal;
}

export async function GET(request: Request): Promise<NextResponse> {
  const env = getEnv();
  const authHeader = request.headers.get("authorization");
  const validBearer = authHeader === `Bearer ${env.CRON_SECRET}`;
  const validCustom = request.headers.get("x-cron-secret") === env.CRON_SECRET;
  if (!validBearer && !validCustom) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const participants = await db.participant.findMany({
    where: { active: true },
    include: { scheduleSetting: true },
  });

  let sent = 0;
  for (const participant of participants) {
    const schedule = participant.scheduleSetting;
    if (!schedule || !schedule.reminderEnabled) {
      continue;
    }
    if (!shouldSendNow(schedule.timezone, schedule.dailyTimeLocal)) {
      continue;
    }

    const { rawToken } = await createCheckinRequest({
      participantId: participant.id,
      source: "SCHEDULED",
    });

    await sendCheckinSms({
      to: participant.phone,
      participantName: participant.name,
      checkinUrl: buildCheckinUrl(rawToken, env.APP_BASE_URL),
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
