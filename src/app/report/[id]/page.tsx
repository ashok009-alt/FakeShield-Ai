import type { Metadata } from "next";
import { ReportView } from "@/components/report-view";

export const metadata: Metadata = {
  title: "Saved analysis report",
  description: "A saved FakeShield AI analysis with warning signs, next steps and the original input.",
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportView id={id} />;
}
