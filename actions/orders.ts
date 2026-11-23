"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { money, isOpenNow, fmtTime } from "@/lib/constants";

const refresh = () => revalidatePath("/", "layout");

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

/** Called from the cart on a shop page. Prices are always re-read from the database. */
export async function placeOrder(
  shopId: string,
  lines: { itemId: string; quantity: number }[],
  deliveryAddress: string,
  note: string,
): Promise<PlaceOrderResult> {
  const user = await requireUser();
  if (!user.isUser) return { ok: false, error: "Your account is not a user account." };
  const address = deliveryAddress.trim();
  if (!address) return { ok: false, error: "Enter a delivery address." };
  const wanted = lines.filter((l) => Number.isInteger(l.quantity) && l.quantity > 0 && l.quantity <= 50);
  if (!wanted.length) return { ok: false, error: "Your cart is empty." };

  const shop = await prisma.shop.findUnique({ where: { id: shopId }, include: { owner: true } });
  if (!shop || shop.owner.isBanned) return { ok: false, error: "Shop not found." };
  if (shop.ownerId === user.id) return { ok: false, error: "You cannot order from your own shop." };
  if (!isOpenNow(shop.opensAt, shop.closesAt)) return { ok: false, error: `${shop.name} is closed right now. It opens at ${fmtTime(shop.opensAt)}.` };

  const items = await prisma.shopItem.findMany({
    where: { id: { in: wanted.map((l) => l.itemId) }, available: true, category: { shopId } },
  });
  if (items.length !== new Set(wanted.map((l) => l.itemId)).size)
    return { ok: false, error: "Some items are no longer available. Please refresh the page." };

  const byId = new Map(items.map((i) => [i.id, i]));
  const total = wanted.reduce((sum, l) => sum + byId.get(l.itemId)!.price * l.quantity, 0);

  const order = await prisma.order.create({
    data: {
      customerId: user.id,
      shopId,
      deliveryAddress: address,
      note: note.trim().slice(0, 300),
      totalAmount: total,
      items: {
        create: wanted.map((l) => {
          const it = byId.get(l.itemId)!;
          return { itemId: it.id, itemName: it.name, quantity: l.quantity, priceAtOrder: it.price };
        }),
      },
    },
  });
  await notify(shop.ownerId, `New order from ${user.name} (${money(total)}).`, "/dashboard?view=shop");
  refresh();
  return { ok: true, orderId: order.id };
}

/** Shop owner accepts / rejects an order. */
export async function respondOrder(orderId: string, accept: boolean) {
  const user = await requireUser();
  if (!user.shop) return;
  const res = await prisma.order.updateMany({
    where: { id: orderId, shopId: user.shop.id, status: "PENDING_SHOP" },
    data: { status: accept ? "READY_FOR_PICKUP" : "REJECTED" },
  });
  if (res.count) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order) {
      await notify(order.customerId, `${user.shop.name} ${accept ? "accepted your order. A rider will pick it up soon." : "could not accept your order."}`);
      if (accept) {
        const riders = await prisma.user.findMany({
          where: { isRider: true, isBanned: false, id: { notIn: [order.customerId, user.id] } },
          select: { id: true },
        });
        if (riders.length)
          await prisma.notification.createMany({
            data: riders.map((r) => ({ userId: r.id, message: `New delivery from ${user.shop!.name}.`, href: "/dashboard?view=rider" })),
          });
      }
    }
  }
  refresh();
}

/** Rider claims an order. updateMany with riderId:null makes sure only one rider can win. */
export async function acceptDelivery(orderId: string) {
  const user = await requireUser();
  if (!user.isRider) return;
  const res = await prisma.order.updateMany({
    where: { id: orderId, status: "READY_FOR_PICKUP", riderId: null, customerId: { not: user.id }, shop: { ownerId: { not: user.id } } },
    data: { status: "OUT_FOR_DELIVERY", riderId: user.id },
  });
  if (res.count) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shop: true } });
    if (order) {
      const phone = user.phone ? ` (${user.phone})` : "";
      await notify(order.shop.ownerId, `Rider ${user.name}${phone} is coming to pick up an order.`, "/dashboard?view=shop");
      await notify(order.customerId, `Rider ${user.name}${phone} is delivering your order from ${order.shop.name}.`);
    }
  }
  refresh();
}

export async function markDelivered(orderId: string) {
  const user = await requireUser();
  const res = await prisma.order.updateMany({
    where: { id: orderId, riderId: user.id, status: "OUT_FOR_DELIVERY" },
    data: { status: "DELIVERED" },
  });
  if (res.count) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shop: true } });
    if (order) {
      await notify(order.customerId, `Your order from ${order.shop.name} was delivered.`);
      await notify(order.shop.ownerId, `An order was delivered to the customer.`, "/dashboard?view=shop");
    }
  }
  refresh();
}
