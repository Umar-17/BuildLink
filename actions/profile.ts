"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fail, done } from "@/lib/flash";
import { cleanUrl } from "@/lib/constants";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function saveLabourProfile(formData: FormData) {
  const user = await requireUser();
  if (!user.isLabour || !user.labourProfile) return fail("You do not have a labour profile.");
  const imageUrl = cleanUrl(str(formData, "imageUrl"));
  if (imageUrl === null) return fail("Photo link must be a valid http(s) address.");
  await prisma.labourProfile.update({
    where: { userId: user.id },
    data: { bio: str(formData, "bio").slice(0, 400), area: str(formData, "area").slice(0, 80), imageUrl },
  });
  revalidatePath("/", "layout");
  return done("Profile saved.");
}
