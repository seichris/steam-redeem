import { NextResponse } from "next/server";
import { query } from "@/lib/db/pool";

export async function GET() {
  try {
    const result = await query<{ now: string }>("select now()::text as now");
    return NextResponse.json({
      ok: true,
      now: result.rows[0]?.now ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

