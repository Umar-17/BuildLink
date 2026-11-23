"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fail, done } from "@/lib/flash";
import { cleanUrl, fromHHMM } from "@/lib/constants";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const refresh = () => revalidatePath("/", "layout");

async function requireShop() {
  const user = await requireUser();
  if (!user.isShopOwner) throw new Error("Not a shop owner");
  return { user, shop: user.shop };
}

export async function saveShop(formData: FormData) {
  const { user, shop } = await requireShop();
  const name = str(formData, "name");
  const address = str(formData, "address") || user.address;
  const description = str(formData, "description");
  if (!name) return fail("Shop name is required.");

  // Optional fields: only touched when the form actually sends them (the quick "create shop" form does not).
  const extra: { imageUrl?: string; area?: string; opensAt?: number; closesAt?: number } = {};
  if (formData.has("imageUrl")) {
    const url = cleanUrl(str(formData, "imageUrl"));
    if (url === null) return fail("Cover photo link must be a valid http(s) address.");
    extra.imageUrl = url;
  }
  if (formData.has("area")) extra.area = str(formData, "area").slice(0, 80);
  if (formData.has("opensAt") || formData.has("closesAt")) {
    const o = fromHHMM(str(formData, "opensAt"));
    const c = fromHHMM(str(formData, "closesAt"));
    if (o === null || c === null) return fail("Enter valid opening and closing times.");
    extra.opensAt = o;
    extra.closesAt = c;
  }

  if (shop) await prisma.shop.update({ where: { id: shop.id }, data: { name, address, description, ...extra } });
  else await prisma.shop.create({ data: { ownerId: user.id, name, address, description, ...extra } });
  refresh();
  if (shop) return done("Shop details saved.");
}

export async function addCategory(formData: FormData) {
  const { shop } = await requireShop();
  const name = str(formData, "name");
  if (!shop) return fail("Create your shop first.");
  if (!name) return fail("Category name is required.");
  await prisma.shopCategory.create({ data: { shopId: shop.id, name } });
  refresh();
}

export async function deleteCategory(categoryId: string) {
  const { shop } = await requireShop();
  if (!shop) return;
  await prisma.shopCategory.deleteMany({ where: { id: categoryId, shopId: shop.id } });
  refresh();
}

export async function addItem(formData: FormData) {
  const { shop } = await requireShop();
  const categoryId = str(formData, "categoryId");
  const name = str(formData, "name");
  const price = Number(formData.get("price"));
  if (!name) return fail("Item name is required.");
  if (!Number.isFinite(price) || price < 0) return fail("Enter a valid price.");
  const cat = shop && (await prisma.shopCategory.findFirst({ where: { id: categoryId, shopId: shop.id } }));
  if (!cat) return fail("Category not found.");
  await prisma.shopItem.create({ data: { categoryId, name, price, description: str(formData, "description") } });
  refresh();
}

export async function updateItem(formData: FormData) {
  const { shop } = await requireShop();
  const id = str(formData, "itemId");
  const name = str(formData, "name");
  const price = Number(formData.get("price"));
  if (!name || !Number.isFinite(price) || price < 0) return fail("Enter a valid name and price.");
  if (!shop) return;
  await prisma.shopItem.updateMany({
    where: { id, category: { shopId: shop.id } },
    data: { name, price, description: str(formData, "description") },
  });
  refresh();
}

export async function toggleItem(itemId: string, available: boolean) {
  const { shop } = await requireShop();
  if (!shop) return;
  await prisma.shopItem.updateMany({ where: { id: itemId, category: { shopId: shop.id } }, data: { available } });
  refresh();
}

export async function deleteItem(itemId: string) {
  const { shop } = await requireShop();
  if (!shop) return;
  await prisma.shopItem.deleteMany({ where: { id: itemId, category: { shopId: shop.id } } });
  refresh();
}
