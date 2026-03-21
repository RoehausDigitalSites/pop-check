import { addHours } from "date-fns";
import type { CheckinSource } from "@prisma/client";
import { db } from "@/lib/db";
import { generateRawToken, hashToken } from "@/lib/tokens";

export async function createCheckinRequest(params: {
  participantId: string;
  source: CheckinSource;
  expiresInHours?: number;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateRawToken();
  const expiresAt = addHours(new Date(), params.expiresInHours ?? 36);

  await db.checkinRequest.create({
    data: {
      participantId: params.participantId,
      tokenHash: hashToken(rawToken),
      source: params.source,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export function buildCheckinUrl(rawToken: string, baseUrl: string): string {
  const safeBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${safeBase}/checkin/${rawToken}`;
}

export function buildManualAccessUrl(rawToken: string, baseUrl: string): string {
  const safeBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${safeBase}/checkin/manual/${rawToken}`;
}
