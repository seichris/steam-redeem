import type { Metadata } from "next";
import "./globals.css";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export const metadata: Metadata = {
  title: "Automated Small Claims Nuke",
  description:
    "A document-generation tool to help you assemble evidence and draft consumer dispute paperwork. Not legal advice."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DisclaimerBanner />
        {children}
      </body>
    </html>
  );
}

