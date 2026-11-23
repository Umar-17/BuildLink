import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fmtTime, isOpenNow, mapsLink, telLink } from "@/lib/constants";
import { submitShopReview } from "@/actions/reviews";
import Nav from "@/components/Nav";
import Flash from "@/components/Flash";
import ShopCart from "@/components/ShopCart";
import { Cover } from "@/components/cards";
import ContactButtons, { InfoGrid } from "@/components/ContactButtons";
import { Badge, Card, Empty, Field, ReviewCard, Section, StarPicker, Stars, btn, inputCls } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { ArrowLeft, MapPin, Phone, Clock, Compass, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, isBanned: true, phone: true } },
      categories: { orderBy: { name: "asc" }, include: { items: { orderBy: { name: "asc" } } } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!shop || shop.owner.isBanned) notFound();
  const isOwner = shop.ownerId === me.id;
  const open = isOpenNow(shop.opensAt, shop.closesAt);
  const itemCount = shop.categories.reduce((n, c) => n + c.items.length, 0);

  // Check if current user has an unreviewed delivered order from this shop
  const unreviewedOrder = !isOwner
    ? await prisma.order.findFirst({
        where: {
          customerId: me.id,
          shopId: shop.id,
          status: "DELIVERED",
          review: null,
        },
        select: { id: true, totalAmount: true },
        orderBy: { createdAt: "desc" },
      })
    : null;

  // Check if current user has already submitted a review for this store
  const myExistingShopReview = !isOwner
    ? await prisma.shopReview.findFirst({
        where: {
          authorId: me.id,
          shopId: shop.id,
        },
      })
    : null;

  return (
    <>
      <Nav user={me} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        <Flash error={sp.error} ok={sp.ok} />

        {/* Shop Overview Header */}
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
          <Cover src={shop.imageUrl} className="h-44 sm:h-56" />

          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
                {shop.name}
              </h1>

              <Badge tone={open ? "good" : "bad"} dot>
                {open ? "Open for Fulfillment" : `Closed · Opens at ${fmtTime(shop.opensAt)}`}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Stars rating={shop.rating} count={shop.ratingCount} size="md" />
              <span className="text-xs text-mute font-mono">
                · {itemCount} catalog item{itemCount === 1 ? "" : "s"}
              </span>
            </div>

            {shop.description && (
              <p className="text-sm leading-relaxed text-mute max-w-3xl">
                {shop.description}
              </p>
            )}

            <div className="border-t border-line pt-5 space-y-4">
              <InfoGrid
                items={[
                  {
                    icon: MapPin,
                    label: "Physical Address",
                    value: (
                      <a
                        href={mapsLink(shop.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline"
                      >
                        {shop.address}
                      </a>
                    ),
                  },
                  {
                    icon: Phone,
                    label: "Store Contact",
                    value: shop.owner.phone ? (
                      <a href={telLink(shop.owner.phone)} className="text-accent hover:underline font-mono">
                        {shop.owner.phone}
                      </a>
                    ) : (
                      "Not provided"
                    ),
                  },
                  {
                    icon: Clock,
                    label: "Operating Hours (PKT)",
                    value: (
                      <span className="font-mono tabular-nums">
                        {fmtTime(shop.opensAt)} – {fmtTime(shop.closesAt)}
                      </span>
                    ),
                  },
                  {
                    icon: Compass,
                    label: "Delivery Neighborhood",
                    value: shop.area || "Area not specified",
                  },
                ]}
              />

              <ContactButtons phone={shop.owner.phone} address={shop.address} />

              {isOwner && (
                <div className="rounded-xl border border-line bg-elevated/60 p-3 text-xs text-mute flex items-start gap-2">
                  <span className="font-semibold text-accent shrink-0">Note:</span>
                  <span>
                    This is the public view customers see. To add items, edit inventory, or change opening hours, visit your{" "}
                    <Link href="/dashboard" className="font-semibold text-accent underline">
                      Shop Dashboard
                    </Link>.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Closed Store Notice */}
        {!open && !isOwner && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold-soft p-4 text-xs sm:text-sm text-gold"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-gold" strokeWidth={2} />
            <div className="space-y-0.5">
              <p className="font-semibold text-gold">Store is currently closed for incoming orders</p>
              <p className="text-gold/90 text-xs leading-relaxed">
                You can browse product availability and pricing. Online checkout will unlock when operating hours resume at{" "}
                <span className="font-mono font-bold">{fmtTime(shop.opensAt)}</span>.
              </p>
            </div>
          </div>
        )}

        {/* Catalog & Cart Component */}
        <div className="pt-2">
          <ShopCart
            shopId={shop.id}
            defaultAddress={me.address}
            canOrder={me.isUser && !isOwner && open}
            categories={shop.categories.map((c) => ({
              id: c.id,
              name: c.name,
              items: c.items.map((i) => ({
                id: i.id,
                name: i.name,
                description: i.description,
                price: i.price,
                available: i.available,
              })),
            }))}
          />
        </div>

        {/* Verified Customer Reviews */}
        <Section
          title="Verified Customer Reviews"
          count={shop.ratingCount}
          hint={isOwner ? undefined : "Customers can review supply stores upon verified order delivery."}
        >
          {/* Active Review Form if the customer has an eligible delivered order */}
          {unreviewedOrder && (
            <div className="mb-6 rounded-2xl border border-accent/40 bg-accent-soft/20 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink font-display">Rate Your Store Experience</h3>
                  <p className="text-xs text-mute mt-0.5">
                    Order: <span className="font-semibold text-ink font-mono">#{unreviewedOrder.id.slice(-6).toUpperCase()}</span> (Delivered)
                  </p>
                </div>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-accent font-mono">
                  Verified Purchaser
                </span>
              </div>

              <form action={submitShopReview} className="space-y-3">
                <input type="hidden" name="orderId" value={unreviewedOrder.id} />
                <StarPicker idPrefix={`shop-review-${unreviewedOrder.id}`} label={`Rate ${shop.name}`} />
                <Field label="Store Review / Feedback">
                  <textarea
                    name="comment"
                    rows={2}
                    maxLength={500}
                    placeholder="Add comments regarding packaging, quality of materials, and delivery speed..."
                    className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                  />
                </Field>
                <SubmitButton className={`${btn} h-10 px-5 text-xs font-semibold`}>
                  Submit Store Review
                </SubmitButton>
              </form>
            </div>
          )}

          {/* User's existing review confirmation */}
          {myExistingShopReview && (
            <div className="mb-4 rounded-xl border border-good/25 bg-good-soft/30 p-3.5 text-xs text-good flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-good" />
                <span>
                  You submitted a verified review (<strong>★ {myExistingShopReview.rating}/5</strong>) for this supply store.
                </span>
              </div>
            </div>
          )}

          {/* Verified review policy for non-purchasers */}
          {!unreviewedOrder && !myExistingShopReview && !isOwner && (
            <div className="mb-4 rounded-xl border border-line bg-elevated/40 p-3.5 text-xs text-mute flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <p>
                <strong className="text-ink">Verified Reviews:</strong> Reviews can be submitted once an order from this store has been fulfilled and delivered.
              </p>
              <a href="#catalog" className="shrink-0 font-semibold text-accent hover:underline">
                Browse Catalog &rarr;
              </a>
            </div>
          )}

          {shop.reviews.length === 0 ? (
            <Empty title="No store reviews published yet">
              Customer feedback and star ratings will appear once deliveries are completed.
            </Empty>
          ) : (
            <div className="space-y-3">
              {shop.reviews.map((r) => (
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
      </main>
    </>
  );
}
