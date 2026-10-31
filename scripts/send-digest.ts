/**
 * Sends the weekly threat report to everyone on the local digest list.
 *
 *   npm run digest:send -- --dry-run          preview without sending
 *   npm run digest:send -- --limit=25         send to at most 25 addresses
 *
 * Requires SENDGRID_API_KEY and SENDGRID_FROM_EMAIL. Run it from cron (or a
 * scheduler) once a week; the demo deliberately does not auto-send any email.
 */
import { loadEnvFile } from "node:process";
import { PrismaClient } from "@prisma/client";
import { buildWeeklyDigest, digestConfigured, sendWeeklyDigest } from "../src/lib/digest";

// `next` loads .env automatically; a standalone script does not.
try {
  loadEnvFile(".env");
} catch {
  /* .env is optional when the variables are exported by the scheduler */
}

const prisma = new PrismaClient();

function argValue(name: string): string | undefined {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : undefined;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limit = Math.max(1, Math.min(500, Number(argValue("limit") ?? 100) || 100));

  if (!digestConfigured()) {
    console.log("SendGrid is not configured.");
    console.log("Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL, then run this again.");
    if (!dryRun) {
      process.exitCode = 1;
      return;
    }
  }

  const subscribers = await prisma.digestSubscriber.findMany({
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { email: true },
  });

  const preview = buildWeeklyDigest();
  console.log(`Subject: ${preview.subject}`);
  console.log(`Subscribers: ${subscribers.length} (limit ${limit})`);

  if (dryRun) {
    console.log("\n--- plain-text preview ---\n");
    console.log(preview.text.replace(/{{email}}/g, "demo@example.com"));
    console.log("\nDry run: no messages sent.");
    return;
  }

  if (subscribers.length === 0) {
    console.log("No subscribers yet. Nothing to send.");
    return;
  }

  let sent = 0;
  let failed = 0;
  for (const subscriber of subscribers) {
    const result = await sendWeeklyDigest(subscriber.email);
    if (result.ok) {
      sent += 1;
      console.log(`sent  ${subscriber.email}`);
    } else {
      failed += 1;
      console.error(`failed ${subscriber.email} — ${result.status} ${result.error ?? ""}`.trim());
      if (result.status === "not_configured") break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
