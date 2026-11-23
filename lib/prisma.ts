import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  // Password hashes are never returned unless a query opts in with `omit: { password: false }`.
  return new PrismaClient({ adapter, omit: { user: { password: true } } });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
