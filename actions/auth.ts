"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
import { LABOUR_TYPES } from "@/lib/constants";
import { fail } from "@/lib/flash";
import type { LabourType } from "@/app/generated/prisma/enums";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function registerUser(formData: FormData) {
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const address = str(formData, "address");
  const phone = str(formData, "phone");
  const isUser = formData.get("isUser") === "on";
  const isLabour = formData.get("isLabour") === "on";
  const isShopOwner = formData.get("isShopOwner") === "on";
  const isRider = formData.get("isRider") === "on";
  const labourType = str(formData, "labourType");
  const bio = str(formData, "bio");

  if (!name || !email || !address) return fail("Name, email and address are required.");
  if (password.length < 8) return fail("Password must be at least 8 characters.");
  if (!isUser && !isLabour && !isShopOwner && !isRider) return fail("Choose at least one account type.");
  if (isLabour && !(LABOUR_TYPES as readonly string[]).includes(labourType)) return fail("Pick your labour trade.");

  if (await prisma.user.findUnique({ where: { email } })) return fail("An account with this email already exists.");

  const user = await prisma.user.create({
    data: {
      name,
      email,
      address,
      phone,
      password: await bcrypt.hash(password, 10),
      isUser,
      isLabour,
      isShopOwner,
      isRider,
      ...(isLabour ? { labourProfile: { create: { labourType: labourType as LabourType, bio } } } : {}),
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginUser(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email }, omit: { password: false } });
  if (!user || !(await bcrypt.compare(password, user.password))) return fail("Invalid email or password.");
  if (user.isBanned) return fail("This account has been banned.");

  await createSession(user.id);
  redirect(user.isAdmin ? "/admin" : "/dashboard");
}

export async function logoutUser() {
  await destroySession();
  redirect("/auth");
}
