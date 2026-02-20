import Link from "next/link";

export function DisclaimerBanner() {
  return (
    <div className="sticky top-0 z-50 border-b bg-black text-white">
      <div className="container flex h-14 items-center justify-between gap-3">
        <p className="text-xs leading-4 text-white/90">
          <span className="font-semibold">Not legal advice.</span> We are not lawyers. This is a
          document-generation tool only. You file in your own name.
        </p>
        <Link className="text-xs underline text-white/90" href="/legal">
          Terms & Legal Shield
        </Link>
      </div>
    </div>
  );
}

