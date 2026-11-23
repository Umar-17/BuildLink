"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fail, done } from "@/lib/flash";
import { notify } from "@/lib/notify";
import { LABOUR_TYPES, money } from "@/lib/constants";
import type { LabourType } from "@/app/generated/prisma/enums";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const refresh = () => revalidatePath("/", "layout");

function parseJob(f: FormData) {
  const title = str(f, "title");
  const description = str(f, "description");
  const budget = Number(f.get("budget"));
  const location = str(f, "location");
  if (!title || !description) return "Title and description are required.";
  if (!Number.isFinite(budget) || budget <= 0) return "Enter a valid amount.";
  return { title, description, budget, location };
}

/** Hire one specific labourer (private request). */
export async function hireLabour(formData: FormData) {
  const user = await requireUser();
  if (!user.isUser) return fail("Your account is not a user account.");
  const labourId = str(formData, "labourId");
  const parsed = parseJob(formData);
  if (typeof parsed === "string") return fail(parsed);

  const labour = await prisma.user.findUnique({ where: { id: labourId }, include: { labourProfile: true } });
  if (!labour || !labour.isLabour || labour.isBanned || !labour.labourProfile) return fail("Labourer not found.");
  if (labour.id === user.id) return fail("You cannot hire yourself.");

  const job = await prisma.job.create({
    data: {
      ...parsed,
      location: parsed.location || user.address,
      labourType: labour.labourProfile.labourType,
      isPublic: false,
      status: "PENDING_DIRECT",
      clientId: user.id,
      assignedLabourId: labour.id,
    },
  });
  await notify(labour.id, `${user.name} sent you a job request: "${job.title}" for ${money(job.budget)}.`);
  refresh();
  return done("Request sent! You'll be notified when they respond.");
}

/** Post a public project that every labourer of the chosen trade can see. */
export async function postPublicJob(formData: FormData) {
  const user = await requireUser();
  if (!user.isUser) return fail("Your account is not a user account.");
  const parsed = parseJob(formData);
  if (typeof parsed === "string") return fail(parsed);
  const type = str(formData, "labourType");
  if (!(LABOUR_TYPES as readonly string[]).includes(type)) return fail("Choose a labour type.");

  const job = await prisma.job.create({
    data: {
      ...parsed,
      location: parsed.location || user.address,
      labourType: type as LabourType,
      isPublic: true,
      status: "OPEN",
      clientId: user.id,
    },
  });
  // Tell matching labourers (not the poster) that a new job is up.
  const labourers = await prisma.user.findMany({
    where: { isLabour: true, isBanned: false, id: { not: user.id }, labourProfile: { labourType: type as LabourType } },
    select: { id: true },
  });
  if (labourers.length) {
    await prisma.notification.createMany({
      data: labourers.map((l) => ({
        userId: l.id,
        message: `New public job: "${job.title}" - budget ${money(job.budget)}.`,
        href: "/dashboard?view=labour",
      })),
    });
  }
  refresh();
  return done("Project posted. Labourers of that trade can now see it.");
}

/** Labour accepts / rejects a direct request. */
export async function respondDirectJob(jobId: string, accept: boolean) {
  const user = await requireUser();
  const res = await prisma.job.updateMany({
    where: { id: jobId, assignedLabourId: user.id, status: "PENDING_DIRECT" },
    data: accept ? { status: "ACCEPTED" } : { status: "REJECTED" },
  });
  if (res.count) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (job) {
      if (accept) await prisma.job.update({ where: { id: jobId }, data: { agreedPrice: job.budget } });
      await notify(job.clientId, `${user.name} ${accept ? "accepted" : "declined"} your job "${job.title}".`);
    }
  }
  refresh();
}

/** Labour sends a price request on a public job. */
export async function submitBid(formData: FormData) {
  const user = await requireUser();
  if (!user.isLabour || !user.labourProfile) return fail("Only labour accounts can send requests.");
  const jobId = str(formData, "jobId");
  const amount = Number(formData.get("proposedAmount"));
  const message = str(formData, "message");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Enter a valid amount.");

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || !job.isPublic || job.status !== "OPEN") return fail("This job is no longer open.");
  if (job.labourType !== user.labourProfile.labourType) return fail("This job is for a different trade.");
  if (job.clientId === user.id) return fail("You cannot bid on your own job.");

  await prisma.jobBid.upsert({
    where: { jobId_labourId: { jobId, labourId: user.id } },
    create: { jobId, labourId: user.id, proposedAmount: amount, message },
    update: { proposedAmount: amount, message, status: "PENDING" },
  });
  await notify(job.clientId, `${user.name} offered to do "${job.title}" for ${money(amount)}.`);
  refresh();
}

/** Client accepts / rejects a labour's request on a public job. */
export async function respondBid(bidId: string, accept: boolean) {
  const user = await requireUser();
  const bid = await prisma.jobBid.findUnique({ where: { id: bidId }, include: { job: true } });
  if (!bid || bid.job.clientId !== user.id || bid.status !== "PENDING") return;

  if (!accept) {
    await prisma.jobBid.update({ where: { id: bidId }, data: { status: "REJECTED" } });
    await notify(bid.labourId, `Your offer on "${bid.job.title}" was declined.`);
  } else {
    if (bid.job.status !== "OPEN") return;
    const others = await prisma.jobBid.findMany({
      where: { jobId: bid.jobId, id: { not: bidId }, status: "PENDING" },
      select: { labourId: true },
    });
    await prisma.$transaction([
      prisma.jobBid.update({ where: { id: bidId }, data: { status: "ACCEPTED" } }),
      prisma.jobBid.updateMany({ where: { jobId: bid.jobId, id: { not: bidId } }, data: { status: "REJECTED" } }),
      prisma.job.update({
        where: { id: bid.jobId },
        data: { status: "ACCEPTED", assignedLabourId: bid.labourId, agreedPrice: bid.proposedAmount },
      }),
    ]);
    await notify(bid.labourId, `You got the job "${bid.job.title}" at ${money(bid.proposedAmount)}!`);
    for (const o of others) await notify(o.labourId, `"${bid.job.title}" was given to another labourer.`);
  }
  refresh();
}

/** Client withdraws a job that has not started. */
export async function cancelJob(jobId: string) {
  const user = await requireUser();
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.clientId !== user.id || !["OPEN", "PENDING_DIRECT"].includes(job.status)) return;
  await prisma.$transaction([
    prisma.job.update({ where: { id: jobId }, data: { status: "REJECTED" } }),
    prisma.jobBid.updateMany({ where: { jobId, status: "PENDING" }, data: { status: "REJECTED" } }),
  ]);
  refresh();
}

/** Client marks the work as done so they can review the labourer. */
export async function completeJob(jobId: string) {
  const user = await requireUser();
  const res = await prisma.job.updateMany({
    where: { id: jobId, clientId: user.id, status: "ACCEPTED" },
    data: { status: "COMPLETED" },
  });
  if (res.count) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (job?.assignedLabourId) await notify(job.assignedLabourId, `"${job.title}" was marked as completed.`);
  }
  refresh();
}
