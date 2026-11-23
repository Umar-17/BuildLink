"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fail, done } from "@/lib/flash";

export async function fileComplaint(formData: FormData) {
  const user = await requireUser();
  const targetUserId = String(formData.get("targetUserId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 10) return fail("Please describe the problem (at least 10 characters).");

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target || !target.isLabour) return fail("Complaints can only be filed against labour accounts.");
  if (target.id === user.id) return fail("You cannot file a complaint against yourself.");

  await prisma.complaint.create({ data: { reporterId: user.id, targetUserId, reason } });
  return done("Complaint submitted. Our admins will review it.");
}
