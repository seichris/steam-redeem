import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { getSteamOpenIdRedirectUrl } from "@/lib/steam/openid";

export async function GET() {
  const appBaseUrl = getAppBaseUrl();
  const returnTo = new URL("/api/auth/steam/callback", appBaseUrl).toString();
  const realm = appBaseUrl.origin;

  const redirectUrl = getSteamOpenIdRedirectUrl({ returnTo, realm });
  return NextResponse.redirect(redirectUrl);
}
