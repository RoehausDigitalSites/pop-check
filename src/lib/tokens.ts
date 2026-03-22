import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

const TOKEN_BYTES = 32;

function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

/** Base64url without Node Buffer (Edge / Workers safe). */
function toBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]!);
  }
  const b64 = btoa(str);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateRawToken(): string {
  return toBase64Url(randomBytes(TOKEN_BYTES));
}

export function hashToken(rawToken: string): string {
  return bytesToHex(sha256(utf8ToBytes(rawToken)));
}

export function createManualAccessToken(): { rawToken: string; tokenHash: string } {
  const rawToken = generateRawToken();
  return { rawToken, tokenHash: hashToken(rawToken) };
}
