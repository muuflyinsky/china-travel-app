// Server side of trip passes: checks a StoreKit 2 transaction that Apple signed, then gives the
// phone a short pass token the AI routes accept instead of counting free uses.
import { createHmac, createHash, createVerify, timingSafeEqual, X509Certificate } from "node:crypto";
import { passDays } from "./products";

const BUNDLE_ID = "com.haodego.app";

// Apple Root CA - G3 (https://www.apple.com/certificateauthority/), SHA-256
// 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79
const APPLE_ROOT = new X509Certificate(Buffer.from("MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM6BgD56KyKA==", "base64"));

// Tokens are signed with a key derived from the service role key, so no extra secret to manage.
// Rotating that key only means phones fetch a new token from their saved transaction.
const tokenKey = () => createHash("sha256").update("haodego-pass:" + (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.PASS_SECRET ?? "")).digest();

type Payload = { bundleId: string; productId: string; transactionId: string; purchaseDate: number; revocationDate?: number; environment: string };

const b64url = (s: string) => Buffer.from(s, "base64url");

/**
 * The transaction inside a StoreKit 2 JWS, if Apple signed it: the x5c chain must end at Apple's
 * root and the leaf must have signed the payload. Transactions from Xcode's local StoreKit testing
 * are signed by Xcode, so they're accepted only outside production.
 */
export function verifyTransaction(jws: string): Payload | null {
  const [h, p, s] = jws.split(".");
  if (!h || !p || !s) return null;
  try {
    const header = JSON.parse(b64url(h).toString()) as { alg: string; x5c?: string[] };
    const payload = JSON.parse(b64url(p).toString()) as Payload;
    if (header.alg !== "ES256" || !header.x5c?.length) return null;
    const chain = header.x5c.map((c) => new X509Certificate(Buffer.from(c, "base64")));
    const local = payload.environment === "Xcode";
    if (local && process.env.VERCEL_ENV === "production") return null;
    if (!local) {
      if (chain.length < 3) return null;
      const now = Date.now();
      for (let i = 0; i < chain.length; i++) {
        const cert = chain[i], issuer = chain[i + 1] ?? APPLE_ROOT;
        if (!cert.verify(issuer.publicKey) || new Date(cert.validTo).getTime() < now) return null;
      }
      if (chain[chain.length - 1].fingerprint256 !== APPLE_ROOT.fingerprint256) return null;
    }
    const ok = createVerify("SHA256").update(`${h}.${p}`).verify({ key: chain[0].publicKey, dsaEncoding: "ieee-p1363" }, b64url(s));
    if (!ok || payload.bundleId !== BUNDLE_ID || payload.revocationDate) return null;
    return payload;
  } catch {
    return null;
  }
}

/** When a verified pass transaction ends, in ms, or null if it isn't a pass. */
export function passEnds(t: Payload) {
  const days = passDays(t.productId);
  return days ? t.purchaseDate + days * 86_400_000 : null;
}

const sign = (body: string) => createHmac("sha256", tokenKey()).update(body).digest("base64url");

/** "<expiry ms>.<device>.<signature>": unlimited AI for this device until expiry. */
export function passToken(device: string, ends: number) {
  const body = `${ends}.${device}`;
  return `${body}.${sign(body)}`;
}

export function passValid(token: string | null, device: string) {
  if (!token || !device) return false;
  const i = token.lastIndexOf(".");
  const body = token.slice(0, i), sig = token.slice(i + 1);
  const [ends, dev] = body.split(".");
  const expect = Buffer.from(sign(body));
  return dev === device && Number(ends) > Date.now() && sig.length === expect.length && timingSafeEqual(Buffer.from(sig), expect);
}
