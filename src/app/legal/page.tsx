import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function LegalPage() {
  return (
    <main className="container py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Terms & Legal Shield</h1>
          <p className="text-sm text-muted-foreground">
            Read this before using the tool. Not legal advice.
          </p>
        </div>

        <Alert>
          <AlertTitle>We are not lawyers.</AlertTitle>
          <AlertDescription>
            This product generates drafts and organizes evidence. It does not provide legal
            advice, legal representation, or outcome guarantees. You file in your own name and
            make your own decisions.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>
            The “swarm” may collect public marketing material you point it at (trailers, dev
            posts, store pages) and organize it into an evidence bundle. You must ensure you
            have the right to use any materials you upload.
          </p>
          <p>
            We do not physically post letters for you unless you explicitly opt into a postal
            service integration (planned). We do not file court claims on your behalf.
          </p>
          <p>
            If you are unsure about your rights or the correct court/process, consult a
            qualified lawyer in your jurisdiction.
          </p>
        </div>

        <div className="text-sm">
          <Link className="underline" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

