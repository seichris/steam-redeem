import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "ascln_session";

export type SessionPayload = {
  steamId: string;
};

function getJwtSecretOrThrow() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "Missing/invalid AUTH_SECRET. Set AUTH_SECRET to a long random string (>= 32 chars)."
    );
  }
  return new TextEncoder().encode(secret);
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export async function signSession(payload: SessionPayload) {
  const secret = getJwtSecretOrThrow();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.steamId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecretOrThrow();
    const { payload } = await jwtVerify(token, secret);
    const steamId = payload.steamId;
    if (typeof steamId !== "string" || !steamId) return null;
    return { steamId };
  } catch {
    return null;
  }
}

