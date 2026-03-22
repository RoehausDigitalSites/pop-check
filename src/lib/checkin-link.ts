import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

/** Valid one-time check-in link: unused token, not expired. */
export async function getValidCheckinRequest(token: string) {
  const tokenHash = hashToken(token);
  const checkinRequest = await db.checkinRequest.findUnique({
    where: { tokenHash },
    include: { participant: true },
  });
  if (
    !checkinRequest ||
    checkinRequest.usedAt ||
    checkinRequest.expiresAt <= new Date()
  ) {
    return null;
  }
  return checkinRequest;
}
