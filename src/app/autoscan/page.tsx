import type { Metadata } from "next";
import { AutoScanClient } from "@/components/auto-scan-client";

export const metadata: Metadata = {
  title: "Auto-Scan",
  description: "FakeShield AI automatically reads your clipboard and scans for threats the moment you open this page.",
};

export default function AutoScanPage() {
  return <AutoScanClient />;
}
