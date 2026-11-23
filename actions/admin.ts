"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function toggleBanUser(userId: string, ban: boolean) {
  const admin = await requireAdmin();
  if (admin.id === userId) return;
  await prisma.user.updateMany({ where: { id: userId, isAdmin: false }, data: { isBanned: ban } });
  revalidatePath("/admin");
}

export async function dismissComplaint(complaintId: string) {
  await requireAdmin();
  await prisma.complaint.deleteMany({ where: { id: complaintId } });
  revalidatePath("/admin");
}
