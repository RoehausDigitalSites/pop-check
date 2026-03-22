import { getEnv, twilioIsConfigured } from "@/lib/env";

/**
 * Twilio REST via fetch — works on Edge (Cloudflare Workers). The official
 * `twilio` SDK uses Node HTTP and is not Edge-compatible.
 */
export async function sendCheckinSms(params: {
  to: string;
  participantName: string;
  checkinUrl: string;
}): Promise<void> {
  const message = [
    `Hi ${params.participantName}, your daily check-in is ready.`,
    `Tap to respond: ${params.checkinUrl}`,
  ].join(" ");

  if (!twilioIsConfigured()) {
    console.log("[mock-sms]", { to: params.to, message });
    return;
  }

  const env = getEnv();
  const sid = env.TWILIO_ACCOUNT_SID!;
  const token = env.TWILIO_AUTH_TOKEN!;
  const from = env.TWILIO_FROM_NUMBER!;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const body = new URLSearchParams({
    To: params.to,
    From: from,
    Body: message,
  });

  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio send failed: ${res.status} ${text}`);
  }
}
