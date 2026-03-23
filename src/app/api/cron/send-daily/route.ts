import { formatInTimeZone } from "date-fns-tz";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { buildCheckinUrl, createCheckinRequest } from "@/lib/checkins";
import { sendCheckinSms } from "@/lib/sms";

/** True if local clock is at or after the configured reminder time (same calendar day). */
function isAtOrAfterReminderTime(timezone: string, dailyTimeLocal: string): boolean {
  const now = new Date();
  const nowHm = formatInTimeZone(now, timezone, "HH:mm");
  const [nh, nm] = nowHm.split(":").map(Number);
  const parts = dailyTimeLocal.trim().split(":");
  const th = Number(parts[0]);
  const tm = Number(parts[1] ?? 0);
  if (Number.isNaN(nh) || Number.isNaN(nm) || Number.isNaN(th) || Number.isNaN(tm)) {
    return false;
  }
  return nh * 60 + nm >= th * 60 + tm;
}

/** True if we already created a scheduled SMS (check-in request) for this local calendar day. */
async function alreadySentScheduledReminderToday(
  participantId: string,
  timezone: string,
): Promise<boolean> {
  const todayLocal = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
  const recent = await db.checkinRequest.findMany({
    where: { participantId, source: "SCHEDULED" },
    orderBy: { sentAt: "desc" },
    take: 15,
  });
  return recent.some(
    (r) => formatInTimeZone(r.sentAt, timezone, "yyyy-MM-dd") === todayLocal,
  );
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
    if (!isAtOrAfterReminderTime(schedule.timezone, schedule.dailyTimeLocal)) {
      continue;
    }
    if (await alreadySentScheduledReminderToday(participant.id, schedule.timezone)) {
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
