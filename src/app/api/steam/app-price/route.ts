import { NextResponse } from "next/server";
import { fetchSteamPriceEstimates } from "@/lib/steam/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const appIdsRaw = url.searchParams.get("appids") ?? "";
  const countryCode = (url.searchParams.get("cc") ?? "us").toLowerCase();

  const appIds = appIdsRaw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 50);

  const prices = await fetchSteamPriceEstimates({ appIds, countryCode });
  return NextResponse.json({ prices });
}

