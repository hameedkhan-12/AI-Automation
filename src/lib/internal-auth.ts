import crypto from "crypto";

export function timingSafeCompare(a?: string | null, b?: string | null): boolean {
  if (!a || !b) {
    return false;
  }

  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();

  return crypto.timingSafeEqual(hashA, hashB);
}

export function validateInternalAuth(
  authHeader?: string | null,
  customSecretHeader?: string | null,
  expectedSecret: string | undefined = process.env.INTERNAL_API_SECRET,
): boolean {
  if (!expectedSecret || expectedSecret.trim() === "") {
    // If no secret is configured on the server, reject internal requests by default
    return false;
  }

  let providedSecret: string | null = null;

  if (authHeader) {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      providedSecret = trimmed.slice(7).trim();
    } else {
      providedSecret = trimmed;
    }
  } else if (customSecretHeader) {
    providedSecret = customSecretHeader.trim();
  }

  return timingSafeCompare(providedSecret, expectedSecret);
}
