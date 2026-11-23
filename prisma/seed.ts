import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true },
    create: { name: "Admin", email, address: "HQ", password: await bcrypt.hash(password, 10), isAdmin: true, isUser: false },
  });
  console.log(`Admin ready: ${email}`);
}

main().finally(() => prisma.$disconnect());
