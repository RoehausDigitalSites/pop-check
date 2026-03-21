import crypto from "node:crypto";

const TOKEN_BYTES = 32;

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generateRawToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashToken(rawToken: string): string {
  return sha256(rawToken);
}

export function createManualAccessToken(): { rawToken: string; tokenHash: string } {
  const rawToken = generateRawToken();
  return { rawToken, tokenHash: hashToken(rawToken) };
}
