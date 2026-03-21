import twilio from "twilio";
import { getEnv, twilioIsConfigured } from "@/lib/env";

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
  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    to: params.to,
    from: env.TWILIO_FROM_NUMBER,
    body: message,
  });
}
