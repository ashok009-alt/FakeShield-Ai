import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPragmasApplied?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// SQLite tuning: WAL lets reads proceed while a write commits, NORMAL sync is
// durable enough for this local store and much cheaper than FULL, and a burst
// timeout absorbs concurrent writes instead of failing with SQLITE_BUSY.
if (!globalForPrisma.prismaPragmasApplied) {
  globalForPrisma.prismaPragmasApplied = true;
  void Promise.all([
    prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL"),
    prisma.$queryRawUnsafe("PRAGMA synchronous=NORMAL"),
    prisma.$queryRawUnsafe("PRAGMA busy_timeout=5000"),
  ]).catch(() => {
    /* Pragmas are an optimisation only; never block a request on them. */
  });
}
