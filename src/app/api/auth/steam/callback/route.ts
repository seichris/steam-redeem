import { NextResponse } from "next/server";
import { getSessionCookieName, signSession } from "@/lib/auth/session";
import { verifySteamOpenIdCallback } from "@/lib/steam/openid";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const result = await verifySteamOpenIdCallback(url.searchParams);

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(result.error)}`, url.origin)
    );
  }

  const token = await signSession({ steamId: result.steamId });
  const res = NextResponse.redirect(new URL("/dashboard", url.origin));
  res.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return res;
}
