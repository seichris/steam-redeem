export type SteamOwnedGame = {
  appid: number;
  name?: string;
  playtime_forever?: number;
  img_icon_url?: string;
};

export type OwnedGame = {
  appId: number;
  name: string;
  iconUrl: string | null;
  playtimeMinutes: number;
};

type GetOwnedGamesResponse = {
  response: {
    game_count: number;
    games?: SteamOwnedGame[];
  };
};

function getSteamApiKeyOrThrow() {
  const key = process.env.STEAM_WEB_API_KEY;
  if (!key) throw new Error("Missing STEAM_WEB_API_KEY");
  return key;
}

export async function fetchOwnedGames(steamId: string): Promise<OwnedGame[]> {
  const key = getSteamApiKeyOrThrow();
  const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/");
  url.searchParams.set("key", key);
  url.searchParams.set("steamid", steamId);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Steam GetOwnedGames failed: ${res.status}`);
  }
  const data = (await res.json()) as GetOwnedGamesResponse;
  const games = data.response.games ?? [];
  return games
    .map((g) => {
      const appId = g.appid;
      const name = g.name ?? `App ${appId}`;
      const iconHash = g.img_icon_url ?? "";
      const iconUrl = iconHash
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`
        : null;
      return {
        appId,
        name,
        iconUrl,
        playtimeMinutes: g.playtime_forever ?? 0
      } satisfies OwnedGame;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

