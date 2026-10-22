import crypto from "crypto";

export function signWebhookPayload(payload: string, secret: string): string {
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${hash}`;
}

export function verifyWebhookSignature(payload: string, signatureHeader: string, secret: string): boolean {
  try {
    const expected = signWebhookPayload(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}