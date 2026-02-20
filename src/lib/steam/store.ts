export type SteamPriceEstimate = {
  appId: number;
  currency: string;
  finalFormatted: string;
  initialFormatted?: string;
  discountPercent?: number;
  isFree?: boolean;
};

function parseAppDetailsPrice(appId: number, payload: unknown): SteamPriceEstimate | null {
  if (!payload || typeof payload !== "object") return null;
  const keyed = payload as Record<string, unknown>;
  const entryRaw = keyed[String(appId)];
  if (!entryRaw || typeof entryRaw !== "object") return null;
  const entry = entryRaw as { success?: unknown; data?: unknown };
  if (entry.success !== true) return null;

  const dataRaw = entry.data;
  if (!dataRaw || typeof dataRaw !== "object") return null;
  const data = dataRaw as { is_free?: unknown; price_overview?: unknown };

  if (data.is_free === true) {
    return {
      appId,
      currency: "",
      finalFormatted: "Free",
      isFree: true
    };
  }

  const priceRaw = data.price_overview;
  if (!priceRaw || typeof priceRaw !== "object") return null;
  const price = priceRaw as Record<string, unknown>;

  return {
    appId,
    currency: typeof price.currency === "string" ? price.currency : "",
    finalFormatted: typeof price.final_formatted === "string" ? price.final_formatted : "",
    initialFormatted:
      typeof price.initial_formatted === "string" ? price.initial_formatted : undefined,
    discountPercent:
      typeof price.discount_percent === "number" ? price.discount_percent : undefined
  };
}

export async function fetchSteamPriceEstimates(args: {
  appIds: number[];
  countryCode: string;
}) {
  const unique = Array.from(new Set(args.appIds)).filter((n) => Number.isFinite(n));
  if (unique.length === 0) return [] as SteamPriceEstimate[];

  const url = new URL("https://store.steampowered.com/api/appdetails");
  url.searchParams.set("appids", unique.join(","));
  url.searchParams.set("cc", args.countryCode);
  url.searchParams.set("filters", "price_overview,is_free");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 }
  });
  if (!res.ok) return [];
  const json = (await res.json()) as unknown;

  const out: SteamPriceEstimate[] = [];
  for (const appId of unique) {
    const parsed = parseAppDetailsPrice(appId, json);
    if (parsed) out.push(parsed);
  }
  return out;
}
