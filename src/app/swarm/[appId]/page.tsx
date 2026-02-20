import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SwarmPage({
  params
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  return (
    <main className="container py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Swarm: AppID {appId}</h1>
        <p className="text-sm text-muted-foreground">
          Phase 2+ will add payment, background agents, evidence collection, and the Letter Before
          Action generator.
        </p>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
