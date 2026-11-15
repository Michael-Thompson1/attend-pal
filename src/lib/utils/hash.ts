/**
 * Server-side hashing utilities.
 * Never call these from Client Components.
 *
 * Uses HMAC-SHA-256 with DEVICE_PEPPER_SECRET so raw values are never stored.
 */

/**
 * Hash a string (IP address or device fingerprint) with the pepper secret.
 * Returns a hex string safe for database storage.
 */
export async function hashIdentifier(raw: string): Promise<string> {
  const pepper = process.env.DEVICE_PEPPER_SECRET;
  if (!pepper) {
    throw new Error("DEVICE_PEPPER_SECRET is not set. Check .env.local.");
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(pepper);
  const msgData = encoder.encode(raw);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
