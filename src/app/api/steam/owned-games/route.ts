import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { fetchOwnedGames } from "@/lib/steam/api";

type RefundableGameRow = {
  app_id: number;
  reason: string;
  confidence: number;
  source: string;
};

function isUndefinedTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "42P01"
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value ?? "";
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const games = await fetchOwnedGames(session.steamId);
    const appIds = [...new Set(games.map((game) => game.appId))];

    const refundableByAppId = new Map<number, RefundableGameRow>();
    if (appIds.length > 0) {
      let refundableRows: RefundableGameRow[] = [];
      try {
        const refundableResult = await query<RefundableGameRow>(
          `
            select app_id, reason, confidence, source
            from refundable_games
            where app_id = any($1::int[])
          `,
          [appIds]
        );
        refundableRows = refundableResult.rows;
      } catch (error) {
        if (!isUndefinedTableError(error)) throw error;
      }

      for (const row of refundableRows) {
        refundableByAppId.set(row.app_id, row);
      }
    }

    const enrichedGames = games.map((game) => {
      const row = refundableByAppId.get(game.appId);
      return {
        ...game,
        refundable: row
          ? {
              reason: row.reason,
              confidence: row.confidence,
              source: row.source
            }
          : null
      };
    });

    return NextResponse.json({ games: enrichedGames });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
