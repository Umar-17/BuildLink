import { prisma } from "@/lib/prisma";
import { money, mapsLink, orderStatusLabel, toHHMM } from "@/lib/constants";
import { addCategory, addItem, deleteCategory, deleteItem, saveShop, toggleItem, updateItem } from "@/actions/shop";
import { respondOrder } from "@/actions/orders";
import { Badge, Card, Empty, Field, ReviewCard, Section, Stars, btn, btnDanger, btnGhost, inputCls } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { Store, Check, Plus, PackageCheck, MapPin, ArrowRight } from "lucide-react";

type Shop = {
  id: string;
  name: string;
  address: string;
  description: string;
  rating: number;
  ratingCount: number;
  imageUrl: string;
  area: string;
  opensAt: number;
  closesAt: number;
};

const STEPS = ["PENDING_SHOP", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
const STEP_LABELS = ["Placed", "Prepared", "Out for Delivery", "Delivered"];

function Stat({ label, value, tone = "" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight font-mono tabular-nums ${tone || "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

function Items({ items }: { items: { quantity: number; itemName: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((i, idx) => (
        <li
          key={idx}
          className="rounded-lg border border-line bg-elevated/60 px-2.5 py-1 text-xs font-medium text-ink font-mono tabular-nums"
        >
          {i.quantity} × {i.itemName}
        </li>
      ))}
    </ul>
  );
}

function Stepper({ status }: { status: string }) {
  const current = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <ol className="flex items-center pt-2" aria-label="Order fulfillment progression">
      {STEP_LABELS.map((label, i) => {
        const done = i <= current;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <span className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done ? "bg-good text-white shadow-xs" : "bg-elevated text-mute border border-line"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${done ? "text-good" : "text-mute"}`}>
                {label}
              </span>
            </span>
            {i < STEP_LABELS.length - 1 && (
              <span
                className={`mx-2 mb-4 h-0.5 flex-1 rounded transition-colors ${
                  i < current ? "bg-good" : "bg-line"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default async function ShopView({
  shop,
  userAddress,
}: {
  shop: Shop | null;
  userAddress: string;
}) {
  /* Initial setup if user has no shop record */
  if (!shop) {
    return (
      <div className="mx-auto max-w-md pt-6">
        <div className="mb-6 text-center space-y-2">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand border border-brand/20"
            aria-hidden
          >
            <Store className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">
            Register Your Supply Store
          </h1>
          <p className="text-xs text-mute max-w-xs mx-auto">
            Set your trade store name. You can configure catalog inventory, categories, and opening hours right after.
          </p>
        </div>
        <Card className="p-6">
          <form action={saveShop} className="space-y-4">
            <input type="hidden" name="address" value={userAddress} />
            <input type="hidden" name="description" value="" />
            <Field label="Store Name">
              <input
                name="name"
                required
                autoFocus
                placeholder="e.g. Metro Electrical &amp; Hardware Supplies"
                className={inputCls}
              />
            </Field>
            <SubmitButton className={`${btn} w-full h-11 text-sm`}>
              Initialize Store
            </SubmitButton>
          </form>
        </Card>
      </div>
    );
  }

  const [categories, orders, reviews] = await Promise.all([
    prisma.shopCategory.findMany({
      where: { shopId: shop.id },
      include: { items: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      where: { shopId: shop.id },
      include: {
        customer: { select: { name: true, phone: true } },
        rider: { select: { name: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shopReview.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { author: { select: { name: true } } },
    }),
  ]);

  const incoming = orders.filter((o) => o.status === "PENDING_SHOP");
  const rest = orders.filter((o) => o.status !== "PENDING_SHOP");
  const inProgress = rest.filter((o) => !["DELIVERED", "REJECTED"].includes(o.status));
  const itemCount = categories.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="space-y-10">
      {/* Store Operations Header */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-line">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge tone="brand">
                <Store className="h-3.5 w-3.5" />
                <span>Supply Store Manager</span>
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink font-display">
              {shop.name}
            </h2>
            <div className="flex items-center gap-2">
              <Stars rating={shop.rating} count={shop.ratingCount} size="md" />
              {shop.address && (
                <a
                  className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
                  href={mapsLink(shop.address)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{shop.address}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Store Metrics */}
        <div className="grid grid-cols-2 gap-3 bg-elevated/30 p-4 sm:grid-cols-4">
          <Stat label="Orders Pending Action" value={incoming.length} tone={incoming.length ? "text-accent" : ""} />
          <Stat label="Active in Fulfillment" value={inProgress.length} />
          <Stat label="Total Catalog SKUs" value={itemCount} />
          <Stat label="Item Categories" value={categories.length} />
        </div>
      </div>

      {/* Incoming Orders Section (Accept -> READY_FOR_PICKUP) */}
      <Section
        title="Incoming Orders Queue"
        hint="Accept customer orders to move them to 'Ready for Pickup' and alert delivery couriers."
        count={incoming.length}
      >
        {incoming.length === 0 ? (
          <Empty title="No incoming customer orders waiting">
            New orders from customers will appear here in real time.
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {incoming.map((o) => (
              <Card key={o.id} className="flex flex-col gap-3.5 border-l-4 border-l-gold">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-ink font-display">{o.customer.name}</h3>
                    {o.customer.phone && (
                      <a
                        href={`tel:${o.customer.phone}`}
                        className="text-xs text-accent hover:underline font-mono"
                      >
                        {o.customer.phone}
                      </a>
                    )}
                  </div>
                  <span className="shrink-0 rounded-lg bg-gold-soft border border-gold/20 px-2.5 py-1 text-xs font-bold text-gold font-mono tabular-nums">
                    {money(o.totalAmount)}
                  </span>
                </div>

                <Items items={o.items} />

                {o.note && (
                  <p className="rounded-xl border border-gold/20 bg-gold-soft/50 p-3 text-xs text-gold">
                    <strong className="uppercase tracking-wider text-[10px] block">Customer Note:</strong>
                    <span>{o.note}</span>
                  </p>
                )}

                <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-line/60">
                  <form action={respondOrder.bind(null, o.id, true)} className="contents">
                    <SubmitButton className={`${btn} h-9 text-xs`}>
                      <PackageCheck className="h-3.5 w-3.5" />
                      <span>Accept &amp; Ready</span>
                    </SubmitButton>
                  </form>
                  <form action={respondOrder.bind(null, o.id, false)} className="contents">
                    <SubmitButton className={`${btnDanger} h-9 text-xs`}>Decline</SubmitButton>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Product Catalog & Category Management */}
      <Section
        title="Inventory Catalog &amp; Menu"
        hint="Organize items by department and manage active stock availability."
      >
        {/* Category Navigation Bar */}
        <div className="sticky top-16 z-10 -mx-1 flex items-center gap-2 overflow-x-auto bg-paper/90 px-1 py-2 backdrop-blur-md">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              className="shrink-0 rounded-xl border border-line bg-card px-3.5 py-1.5 text-xs font-semibold text-mute transition-colors hover:border-line-hover hover:text-ink"
            >
              <span>{c.name}</span>
              <span className="ml-1 text-[11px] font-mono text-accent">({c.items.length})</span>
            </a>
          ))}

          {/* Toggle New Category Checkbox */}
          <label
            htmlFor="toggle-new-category"
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-accent/60 px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent-soft"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Category</span>
          </label>
        </div>

        {/* New Category Form Container */}
        <div>
          <input
            id="toggle-new-category"
            type="checkbox"
            className="peer sr-only"
            defaultChecked={categories.length === 0}
          />
          <Card className="mt-3 hidden bg-elevated/40 peer-checked:block p-5">
            <form action={addCategory} className="flex flex-wrap items-end gap-3">
              <div className="min-w-48 flex-1">
                <Field label="Category Title">
                  <input
                    name="name"
                    required
                    placeholder="e.g. Copper Piping, Electrical Cables, Emulsion Paints"
                    className={inputCls}
                  />
                </Field>
              </div>
              <SubmitButton className={`${btn} h-11 px-5 text-xs`}>
                Create Department
              </SubmitButton>
            </form>
          </Card>
        </div>

        {categories.length === 0 && (
          <Empty title="No product categories created yet">
            Add your first category above to begin listing items.
          </Empty>
        )}

        {/* Categories & Items Listing */}
        <div className="space-y-6">
          {categories.map((c) => (
            <Card key={c.id} className="p-0 overflow-hidden">
              <div id={`cat-${c.id}`} className="scroll-mt-24" />
              <input id={`toggle-add-${c.id}`} type="checkbox" className="peer sr-only" />

              {/* Department Header */}
              <div className="flex items-center gap-3 border-b border-line px-5 py-4 bg-elevated/20">
                <h3 className="text-base font-bold text-ink font-display">{c.name}</h3>
                <span className="rounded-full bg-elevated border border-line px-2 py-0.5 text-xs font-semibold text-mute font-mono">
                  {c.items.length} {c.items.length === 1 ? "item" : "items"}
                </span>

                <form action={deleteCategory.bind(null, c.id)} className="ml-auto">
                  <button className="text-xs font-semibold text-bad hover:underline cursor-pointer">
                    Delete
                  </button>
                </form>

                <label
                  htmlFor={`toggle-add-${c.id}`}
                  className="cursor-pointer grid h-8 w-8 place-items-center rounded-lg bg-accent text-white shadow-xs hover:bg-accent-hover transition-colors"
                  title={`Add item to ${c.name}`}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </label>
              </div>

              {/* Add Item to Category Form */}
              <form
                action={addItem}
                className="hidden gap-3 border-b border-line bg-accent-soft/20 p-5 peer-checked:grid sm:grid-cols-[1.2fr_8rem_1.5fr_auto] sm:items-end"
              >
                <input type="hidden" name="categoryId" value={c.id} />
                <Field label="Item Title">
                  <input name="name" required placeholder="e.g., 1/2 inch Brass Valve" className={inputCls} />
                </Field>
                <Field label="Price (Rs)">
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="1200"
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label="Specifications / Description">
                  <input name="description" placeholder="Optional details..." className={inputCls} />
                </Field>
                <SubmitButton className={`${btn} h-11 px-5 text-xs`}>Add SKU</SubmitButton>
              </form>

              {/* Items Grid */}
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {c.items.map((i) => (
                  <div
                    key={i.id}
                    className={`flex flex-col rounded-xl border border-line bg-card p-4 shadow-xs transition-shadow ${
                      i.available ? "" : "opacity-60 bg-elevated/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-sm text-ink">{i.name}</h4>
                      {!i.available && <Badge tone="bad">Out of stock</Badge>}
                    </div>

                    {i.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-mute">{i.description}</p>
                    )}

                    <p className="mt-3 text-sm font-bold text-accent font-mono tabular-nums">
                      {money(i.price)}
                    </p>

                    <div className="mt-auto pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                      <form action={toggleItem.bind(null, i.id, !i.available)}>
                        <SubmitButton className={`${btnGhost} h-8 px-3 text-[11px]`}>
                          {i.available ? "Mark Unavailable" : "Mark In-Stock"}
                        </SubmitButton>
                      </form>
                      <form action={deleteItem.bind(null, i.id)}>
                        <button className="text-[11px] font-semibold text-bad hover:underline cursor-pointer">
                          Remove
                        </button>
                      </form>
                    </div>

                    {/* Edit Drawer */}
                    <details className="mt-2 group">
                      <summary className="cursor-pointer list-none text-xs font-semibold text-accent hover:underline">
                        <span className="group-open:hidden">Edit SKU details</span>
                        <span className="hidden group-open:inline">Close editor</span>
                      </summary>
                      <form action={updateItem} className="mt-3 grid gap-2.5 border-t border-line pt-2.5">
                        <input type="hidden" name="itemId" value={i.id} />
                        <Field label="Title">
                          <input name="name" defaultValue={i.name} className={`${inputCls} h-9 text-xs`} />
                        </Field>
                        <Field label="Price (Rs)">
                          <input
                            name="price"
                            type="number"
                            min="0"
                            step="any"
                            defaultValue={i.price}
                            className={`${inputCls} h-9 text-xs font-mono`}
                          />
                        </Field>
                        <Field label="Description">
                          <input
                            name="description"
                            defaultValue={i.description}
                            className={`${inputCls} h-9 text-xs`}
                          />
                        </Field>
                        <SubmitButton className={`${btnGhost} h-8 px-3 text-xs w-full`}>
                          Update SKU
                        </SubmitButton>
                      </form>
                    </details>
                  </div>
                ))}

                {/* Add item tile */}
                <label
                  htmlFor={`toggle-add-${c.id}`}
                  className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line text-mute transition-colors hover:border-accent hover:text-accent hover:bg-accent-soft/20 p-4"
                >
                  <Plus className="h-5 w-5" strokeWidth={2} />
                  <span className="text-xs font-semibold">
                    {c.items.length === 0 ? `Add initial item to ${c.name}` : "Add new item"}
                  </span>
                </label>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Order Fulfillment Tracking Section */}
      <Section
        title="Fulfillment Tracking"
        hint="Live status of dispatched orders progressing through courier delivery."
      >
        {rest.length === 0 ? (
          <Empty title="No historical or active fulfilled orders yet">
            Orders accepted from the incoming queue will be tracked here.
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rest.map((o) => {
              const isRejected = o.status === "REJECTED";
              const isDelivered = o.status === "DELIVERED";
              return (
                <Card key={o.id} className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
                    <div>
                      <h3 className="font-bold text-sm text-ink font-display">{o.customer.name}</h3>
                      <p className="text-xs text-mute font-mono tabular-nums">{money(o.totalAmount)}</p>
                    </div>
                    <Badge tone={isDelivered ? "good" : isRejected ? "bad" : "gold"} dot>
                      {orderStatusLabel(o.status)}
                    </Badge>
                  </div>

                  <Items items={o.items} />

                  {!isRejected && <Stepper status={o.status} />}

                  {o.rider ? (
                    <div className="rounded-xl border border-line bg-elevated/40 p-3 text-xs text-ink font-medium">
                      Courier: <strong>{o.rider.name}</strong>
                      {o.rider.phone && (
                        <span className="font-mono text-mute ml-1">({o.rider.phone})</span>
                      )}
                      <span className="block text-[11px] text-mute mt-0.5">
                        {o.status === "OUT_FOR_DELIVERY"
                          ? "En route to delivery address"
                          : "Package delivered"}
                      </span>
                    </div>
                  ) : o.status === "READY_FOR_PICKUP" ? (
                    <p className="rounded-xl border border-gold/20 bg-gold-soft/40 p-3 text-xs text-gold">
                      Package prepared. Awaiting nearby rider courier dispatch.
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {/* Store Reviews Section */}
      <Section title="Store Customer Reviews" count={shop.ratingCount}>
        {reviews.length === 0 ? (
          <Empty title="No verified store reviews yet">
            Customer feedback will display here once orders are delivered.
          </Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                rating={r.rating}
                author={r.author.name}
                comment={r.comment}
                date={r.createdAt}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Store Configuration Details */}
      <Section title="Store Operating Configuration">
        <Card className="p-6">
          <form action={saveShop} className="grid gap-4 sm:grid-cols-2">
            <Field label="Store Commercial Title">
              <input name="name" defaultValue={shop.name} required className={inputCls} />
            </Field>

            <Field label="Physical Store Address">
              <input name="address" defaultValue={shop.address} className={inputCls} />
            </Field>

            <Field label="Neighborhood / Area">
              <input
                name="area"
                defaultValue={shop.area}
                maxLength={80}
                placeholder="e.g. Model Town, Lahore"
                className={inputCls}
              />
            </Field>

            <Field label="Storefront Cover Image Link (https://…)">
              <input
                name="imageUrl"
                type="url"
                defaultValue={shop.imageUrl}
                placeholder="https://…/storefront.jpg"
                className={inputCls}
              />
            </Field>

            <Field label="Opening Time (PKT)">
              <input
                name="opensAt"
                type="time"
                required
                defaultValue={toHHMM(shop.opensAt)}
                className={`${inputCls} font-mono`}
              />
            </Field>

            <Field label="Closing Time (PKT)">
              <input
                name="closesAt"
                type="time"
                required
                defaultValue={toHHMM(shop.closesAt)}
                className={`${inputCls} font-mono`}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Store Description">
                <textarea
                  name="description"
                  defaultValue={shop.description}
                  rows={2}
                  className="w-full rounded-xl border border-line bg-card p-3.5 text-sm text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:col-span-2 pt-2">
              <SubmitButton className={`${btn} h-11 px-6`}>Save Store Configuration</SubmitButton>
              {shop.address && (
                <a
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                  href={mapsLink(shop.address)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Verify on Google Maps</span>
                </a>
              )}
            </div>
          </form>
        </Card>
      </Section>
    </div>
  );
}
