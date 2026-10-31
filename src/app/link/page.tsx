import type { Metadata } from "next";
import { LinkCheckerClient } from "@/components/link-client";

export const metadata: Metadata = {
  title: "Link reputation checker",
  description:
    "Check a suspicious link without opening it. FakeShield inspects the domain, lookalike brands, public registration age, declared redirects and file types, with optional Google Safe Browsing lookups.",
};

export default function LinkPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
          Link checker
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Inspect a link before you click it.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          Most phishing starts with a link that looks almost right. FakeShield breaks down the URL
          structure and flags impersonation patterns — without visiting the page.
        </p>
      </div>

      <div className="mt-8">
        <LinkCheckerClient />
      </div>

      <p className="mt-6 max-w-3xl text-[11px] leading-5 text-stone-500">
        URL checks run entirely on the server. The submitted link is parsed as text; the page is
        never loaded, proxied, screenshotted or rendered in an iframe. Domain age comes from the
        public RDAP registry, which does not contact the site. Submitted links are stored with your
        session so you can revisit the result, and can be deleted from your history at any time. A
        clean scan is not proof that a link is safe.
      </p>
    </div>
  );
}
