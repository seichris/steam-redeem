import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { query } from "@/lib/db/pool";
import Link from "next/link";

type SearchParams = { [key: string]: string | string[] | undefined };
type CatalogGameRow = {
  game: string;
  company: string;
  status: string;
  evidence_strength: string;
  confidence: number;
  steam_app_id: number | null;
  sources: unknown;
};

type SourceRef = {
  url: string;
  hostname: string;
};

function isUndefinedTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "42P01"
  );
}

function titleize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractSourceRefs(raw: unknown): SourceRef[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const refs: SourceRef[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const urlRaw = (entry as { url?: unknown }).url;
    if (typeof urlRaw !== "string") continue;

    try {
      const parsed = new URL(urlRaw);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;
      if (seen.has(parsed.href)) continue;
      seen.add(parsed.href);
      refs.push({ url: parsed.href, hostname: parsed.hostname });
    } catch {
      // ignore malformed source URLs from seed data
    }
  }

  return refs;
}

function faviconForHost(hostname: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
}

async function loadCatalogGames() {
  try {
    const result = await query<CatalogGameRow>(
      `
        select game, company, status, evidence_strength, confidence, steam_app_id, sources
        from refundable_catalog_games
        order by
          case evidence_strength
            when 'strong' then 0
            when 'medium' then 1
            when 'weak' then 2
            else 3
          end,
          confidence desc,
          game asc
      `
    );
    return { rows: result.rows, loadError: "" };
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return { rows: [] as CatalogGameRow[], loadError: "Run migrations and seed to load the catalog." };
    }
    if (error instanceof Error && error.message.includes("Missing DATABASE_URL")) {
      return { rows: [] as CatalogGameRow[], loadError: "DATABASE_URL is not configured." };
    }
    throw error;
  }
}

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const { rows: catalogGames, loadError } = await loadCatalogGames();
  const resolved = searchParams ? await searchParams : undefined;
  const error =
    typeof resolved?.error === "string"
      ? resolved.error
      : Array.isArray(resolved?.error)
        ? resolved?.error[0]
        : "";

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-slate-50 to-white">
      <div className="container py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              Internal codename: Automated Small Claims Nuke
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900">
              Launch the swarm. Build the evidence bundle. Send the letter.
            </h1>
            <p className="text-pretty text-slate-600">
              If a broken AAA game or vaporware got your refund denied, this tool helps
              you assemble receipts, marketing promises, and a ruthlessly cited Letter Before
              Action. You file in your own name.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <a href="/api/auth/steam">Check against your Steam games</a>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/legal">Terms & Legal Shield</Link>
              </Button>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Steam login is optional. The list below includes tracked refund cases across all platforms.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Steam sign-in failed: {error}
            </div>
          ) : null}

          <div className="rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Refundable game watchlist
                </h2>
                <p className="text-sm text-slate-600">Total tracked games: {catalogGames.length}</p>
              </div>
            </div>

            {loadError ? (
              <div className="p-4 text-sm text-amber-700">{loadError}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>On Steam</TableHead>
                    <TableHead>Sources</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogGames.length > 0 ? (
                    catalogGames.map((game) => {
                      const sourceRefs = extractSourceRefs(game.sources);
                      return (
                        <TableRow key={`${game.game}:${game.company}`}>
                          <TableCell className="font-medium text-slate-900">{game.game}</TableCell>
                          <TableCell>{game.company}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{titleize(game.status)}</Badge>
                          </TableCell>
                          <TableCell>{titleize(game.evidence_strength)}</TableCell>
                          <TableCell>{Math.round(game.confidence * 100)}%</TableCell>
                          <TableCell>
                            {game.steam_app_id ? `Yes (${game.steam_app_id})` : "No / Unknown"}
                          </TableCell>
                          <TableCell>
                            {sourceRefs.length > 0 ? (
                              <div className="flex items-center gap-2">
                                {sourceRefs.slice(0, 6).map((source) => (
                                  <a
                                    key={`${game.game}:${source.url}`}
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={source.hostname}
                                    aria-label={`Open source ${source.hostname}`}
                                    className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded border bg-white"
                                  >
                                    <img
                                      src={faviconForHost(source.hostname)}
                                      alt=""
                                      width={16}
                                      height={16}
                                    />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                        No games loaded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Important:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>We are not lawyers. This is document generation only.</li>
              <li>You choose the jurisdiction and file in your own name.</li>
              <li>No outcome is guaranteed.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
