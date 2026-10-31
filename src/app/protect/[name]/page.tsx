import type { Metadata } from "next";
import { SimpleCheckClient } from "@/components/simple-check";
import { protectDisplayName } from "@/lib/protect";

export const metadata: Metadata = {
  title: "A family scam check",
  description: "Paste a suspicious message and get a plain YES / MAYBE / NO answer.",
  robots: { index: false, follow: false },
};

export default async function ProtectNamePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const display = protectDisplayName(name);

  return (
    <div className="page-shell flex min-h-[70vh] flex-col justify-center py-10 sm:py-14">
      <SimpleCheckClient name={display} />
      <p className="mx-auto mt-8 max-w-xl text-center text-[10px] leading-5 text-stone-600">
        This personal link is not indexed by search engines. FakeShield AI provides risk guidance,
        not a final security verdict.
      </p>
    </div>
  );
}
