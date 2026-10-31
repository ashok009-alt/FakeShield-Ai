/**
 * Generates prisma/schema.postgres.prisma from the SQLite schema.
 *
 * SQLite stays the zero-setup default for the demo. Run `npm run db:postgres`
 * with DATABASE_URL pointing at Neon/Postgres to generate a Postgres client and
 * push the same models. Running `npm run db:push` afterwards switches the local
 * demo back to SQLite.
 */
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("prisma/schema.prisma", "utf8");
const output = source.replace('provider = "sqlite"', 'provider = "postgresql"');

if (output === source) {
  throw new Error("Could not find the SQLite datasource block in prisma/schema.prisma");
}

writeFileSync(
  "prisma/schema.postgres.prisma",
  `// GENERATED from prisma/schema.prisma — do not edit by hand.\n// Provider swapped to PostgreSQL for a Neon/serverless deployment.\n\n${output}`
);

console.log("Wrote prisma/schema.postgres.prisma (provider: postgresql)");
