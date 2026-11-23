"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/flash";
import { notify } from "@/lib/notify";

export async function submitReview(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("Pick a rating from 1 to 5.");

  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { review: true } });
  if (!job || job.clientId !== user.id || job.status !== "COMPLETED" || !job.assignedLabourId) return fail("You can only review your completed jobs.");
  if (job.review) return fail("You already reviewed this job.");

  await prisma.review.create({
    data: { jobId, authorId: user.id, targetUserId: job.assignedLabourId, rating, comment },
  });
  const agg = await prisma.review.aggregate({
    where: { targetUserId: job.assignedLabourId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.labourProfile.update({
    where: { userId: job.assignedLabourId },
    data: { rating: agg._avg.rating ?? 0, ratingCount: agg._count._all },
  });
  await notify(job.assignedLabourId, `${user.name} rated you ${rating}/5 for "${job.title}".`, `/labour/${job.assignedLabourId}`);
  revalidatePath("/", "layout");
}

/** Customer reviews the shop for a delivered order (one review per order). */
export async function submitShopReview(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 500);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("Pick a rating from 1 to 5.");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { review: true, shop: { select: { id: true, name: true, ownerId: true } } },
  });
  if (!order || order.customerId !== user.id || order.status !== "DELIVERED") return fail("You can only review orders delivered to you.");
  if (order.review) return fail("You already reviewed this order.");

  await prisma.shopReview.create({
    data: { orderId, shopId: order.shopId, authorId: user.id, rating, comment },
  });
  const agg = await prisma.shopReview.aggregate({
    where: { shopId: order.shopId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.shop.update({
    where: { id: order.shopId },
    data: { rating: agg._avg.rating ?? 0, ratingCount: agg._count._all },
  });
  await notify(order.shop.ownerId, `${user.name} rated ${order.shop.name} ${rating}/5.`, `/shop/${order.shopId}`);
  revalidatePath("/", "layout");
}
