import { Button } from "@/components/ui/button";
import Link from "next/link";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const error =
    typeof resolved?.error === "string"
      ? resolved.error
      : Array.isArray(resolved?.error)
        ? resolved?.error[0]
        : "";

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-slate-50 to-white">
      <div className="container py-16">
        <div className="mx-auto max-w-2xl space-y-6">
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

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="/api/auth/steam">Sign in with Steam</a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/legal">Terms & Legal Shield</Link>
            </Button>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Steam sign-in failed: {error}
            </div>
          ) : null}

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
