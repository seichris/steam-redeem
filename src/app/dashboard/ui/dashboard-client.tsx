"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getJurisdictionById, JURISDICTIONS, type JurisdictionId } from "@/lib/jurisdiction";

type OwnedGame = {
  appId: number;
  name: string;
  iconUrl: string | null;
  playtimeMinutes: number;
};

type PriceEstimate = {
  appId: number;
  finalFormatted: string;
  initialFormatted?: string;
  discountPercent?: number;
  isFree?: boolean;
};

function refundPotential(playtimeMinutes: number) {
  return playtimeMinutes <= 120 ? "High" : "Medium";
}

export function DashboardClient() {
  const [jurisdictionId, setJurisdictionId] = React.useState<JurisdictionId>("UK");
  const jurisdiction = React.useMemo(
    () => getJurisdictionById(jurisdictionId),
    [jurisdictionId]
  );

  const [purchaseDate, setPurchaseDate] = React.useState<string>("");
  const [refundDenialFileName, setRefundDenialFileName] = React.useState<string>("");

  const [games, setGames] = React.useState<OwnedGame[]>([]);
  const [pricesByAppId, setPricesByAppId] = React.useState<Record<number, PriceEstimate>>(
    {}
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/steam/owned-games", { cache: "no-store" });
        const data = (await res.json()) as { games?: OwnedGame[]; error?: string };
        if (!res.ok) throw new Error(data.error || `Failed: ${res.status}`);
        if (!cancelled) setGames(data.games ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = React.useMemo<ColumnDef<OwnedGame>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Game",
        cell: ({ row }) => {
          const g = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 overflow-hidden rounded bg-slate-100">
                {g.iconUrl ? (
                  <Image
                    alt=""
                    src={g.iconUrl}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-900">{g.name}</div>
                <div className="text-xs text-slate-500">AppID {g.appId}</div>
              </div>
            </div>
          );
        }
      },
      {
        id: "price",
        header: "Price (est.)",
        cell: ({ row }) => {
          const price = pricesByAppId[row.original.appId];
          return <span className="text-slate-700">{price?.finalFormatted ?? "—"}</span>;
        }
      },
      {
        id: "refundPotential",
        header: "Refund Potential",
        cell: ({ row }) => {
          const value = refundPotential(row.original.playtimeMinutes);
          return (
            <Badge variant={value === "High" ? "default" : "secondary"}>{value}</Badge>
          );
        }
      },
      {
        id: "swarmStrength",
        header: "Swarm Strength",
        cell: () => <span className="text-slate-700">0</span>
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/swarm/${row.original.appId}`}>Launch Swarm</Link>
          </Button>
        )
      }
    ],
    [pricesByAppId]
  );

  const table = useReactTable({
    data: games,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } }
  });

  const visibleAppIds = React.useMemo(
    () => table.getRowModel().rows.map((r) => r.original.appId),
    [table]
  );

  React.useEffect(() => {
    const missing = visibleAppIds.filter((id) => !pricesByAppId[id]);
    if (missing.length === 0) return;

    const controller = new AbortController();
    async function loadPrices() {
      try {
        const url = new URL("/api/steam/app-price", window.location.origin);
        url.searchParams.set("appids", missing.slice(0, 20).join(","));
        url.searchParams.set("cc", jurisdiction.steamStoreCc);
        const res = await fetch(url.toString(), { signal: controller.signal });
        const data = (await res.json()) as { prices?: PriceEstimate[] };
        const prices = data.prices ?? [];
        if (prices.length === 0) return;
        setPricesByAppId((prev) => {
          const next = { ...prev };
          for (const p of prices) next[p.appId] = p;
          return next;
        });
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    loadPrices();

    return () => controller.abort();
  }, [visibleAppIds, jurisdiction.steamStoreCc, pricesByAppId]);

  async function onSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main className="container py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Select your target.</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a jurisdiction, add optional context, then launch the swarm on a game.
            </p>
          </div>
          <Button variant="secondary" onClick={onSignOut}>
            Sign out
          </Button>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Jurisdiction</Label>
              <Select
                value={jurisdictionId}
                onValueChange={(v) => setJurisdictionId(v as JurisdictionId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                UK flow currently targets England & Wales (MCOL/OCMC).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Purchase date (optional)</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used later to tailor deadlines and eligibility language.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Refund denial screenshot (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setRefundDenialFileName(e.target.files?.[0]?.name ?? "")}
              />
              <p className="text-xs text-muted-foreground">
                {refundDenialFileName ? `Selected: ${refundDenialFileName}` : "No file selected"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white">
          <div className="border-b p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Your Steam library</h2>
                <p className="text-sm text-muted-foreground">
                  Price is estimated from the Steam store for {jurisdiction.label}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : loading ? (
            <div className="p-4 text-sm text-slate-600">Loading owned games…</div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No games found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </main>
  );
}
