import "server-only";
import { prisma } from "@/lib/prisma";

export async function notify(userId: string, message: string, href = "/dashboard") {
  await prisma.notification.create({ data: { userId, message, href } });
}
