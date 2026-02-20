import { NextResponse } from "next/server";
import { getSteamOpenIdRedirectUrl } from "@/lib/steam/openid";

export async function GET() {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const returnTo = `${baseUrl}/api/auth/steam/callback`;
  const realm = baseUrl;

  const redirectUrl = getSteamOpenIdRedirectUrl({ returnTo, realm });
  return NextResponse.redirect(redirectUrl);
}

