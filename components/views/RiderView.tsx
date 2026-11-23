import { prisma } from "@/lib/prisma";
import { money, mapsLink, orderStatusLabel } from "@/lib/constants";
import { acceptDelivery, markDelivered } from "@/actions/orders";
import { Badge, Card, Empty, Section, btn } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { Bike, MapPin, Navigation, Phone, CheckCircle2, ArrowRight } from "lucide-react";

type Stop = {
  shopName: string;
  shopAddress: string;
  customerName: string;
  customerPhone: string | null;
  deliveryAddress: string;
};

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

function Route({ s }: { s: Stop }) {
  return (
    <div className="relative space-y-3 rounded-xl border border-line bg-elevated/40 p-4 text-xs">
      <span
        className="absolute left-[1.35rem] top-8 bottom-8 w-px border-l-2 border-dashed border-line"
        aria-hidden
      />

      {/* Pickup Stop */}
      <div className="flex gap-3 items-start">
        <span className="z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-xs">
          A
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-mute">
            Pickup Store Location
          </p>
          <p className="font-bold text-sm text-ink font-display">{s.shopName}</p>
          <a
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-0.5"
            target="_blank"
            rel="noreferrer"
            href={mapsLink(s.shopAddress)}
          >
            <Navigation className="h-3 w-3" />
            <span>{s.shopAddress}</span>
          </a>
        </div>
      </div>

      {/* Delivery Drop-off Stop */}
      <div className="flex gap-3 items-start pt-1">
        <span className="z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-good text-[10px] font-bold text-white shadow-xs">
          B
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-mute">
            Customer Delivery Address
          </p>
          <p className="font-bold text-sm text-ink font-display">{s.customerName}</p>
          {s.customerPhone && (
            <a
              href={`tel:${s.customerPhone}`}
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-mono my-0.5"
            >
              <Phone className="h-3 w-3" />
              <span>{s.customerPhone}</span>
            </a>
          )}
          <a
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
            href={mapsLink(s.deliveryAddress)}
          >
            <MapPin className="h-3 w-3" />
            <span>{s.deliveryAddress}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function Items({ items }: { items: { quantity: number; itemName: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((i, idx) => (
        <li
          key={idx}
          className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-medium text-ink font-mono tabular-nums shadow-xs"
        >
          {i.quantity} × {i.itemName}
        </li>
      ))}
    </ul>
  );
}

export default async function RiderView({ userId }: { userId: string }) {
  const include = {
    shop: { select: { name: true, address: true } },
    customer: { select: { name: true, phone: true } },
    items: true,
  } as const;

  const [available, mine] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: "READY_FOR_PICKUP",
        riderId: null,
        customerId: { not: userId },
        shop: { ownerId: { not: userId } },
      },
      include,
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { riderId: userId },
      include,
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const current = mine.filter((o) => o.status === "OUT_FOR_DELIVERY");
  const done = mine.filter((o) => o.status === "DELIVERED");

  const stop = (o: (typeof available)[number]): Stop => ({
    shopName: o.shop.name,
    shopAddress: o.shop.address,
    customerName: o.customer.name,
    customerPhone: o.customer.phone,
    deliveryAddress: o.deliveryAddress,
  });

  return (
    <div className="space-y-10">
      {/* Rider Header */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-line">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge tone="brand">
                <Bike className="h-3.5 w-3.5" />
                <span>Courier Dispatch Hub</span>
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink font-display">
              Delivery Operations
            </h2>
            <p className="text-xs text-mute">
              Pick up packages from verified supply stores and deliver directly to client locations.
            </p>
          </div>
        </div>

        {/* Courier KPI Metrics */}
        <div className="grid grid-cols-3 gap-3 bg-elevated/30 p-4">
          <Stat label="Active Deliveries" value={current.length} tone={current.length ? "text-good" : ""} />
          <Stat label="Waiting for Pickup" value={available.length} tone={available.length ? "text-accent" : ""} />
          <Stat label="Successfully Delivered" value={done.length} />
        </div>
      </div>

      {/* Current Active Deliveries (OUT_FOR_DELIVERY -> DELIVERED) */}
      <Section
        title="Active Dispatches in Transit"
        hint="Orders you have claimed. Confirm physical delivery once handed to the client."
        count={current.length}
      >
        {current.length === 0 ? (
          <Empty title="No deliveries currently en route">
            Claim an incoming ready order below to start a dispatch route.
          </Empty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {current.map((o) => (
              <Card key={o.id} className="flex flex-col gap-3.5 border-l-4 border-l-good">
                <div className="flex items-start justify-between gap-3">
                  <Items items={o.items} />
                  <span className="shrink-0 rounded-lg bg-good-soft border border-good/20 px-2.5 py-1 text-xs font-bold text-good font-mono tabular-nums">
                    {money(o.totalAmount)}
                  </span>
                </div>

                {o.note && (
                  <p className="rounded-xl border border-gold/20 bg-gold-soft/50 p-2.5 text-xs text-gold">
                    <strong className="block text-[10px] uppercase tracking-wider">Delivery Instructions:</strong>
                    <span>{o.note}</span>
                  </p>
                )}

                <Route s={stop(o)} />

                <form action={markDelivered.bind(null, o.id)} className="mt-auto pt-2 border-t border-line/60">
                  <SubmitButton className={`${btn} w-full h-11 text-xs`}>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Package Delivered</span>
                  </SubmitButton>
                </form>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Available Ready Orders (READY_FOR_PICKUP -> Claim) */}
      <Section
        title="Orders Ready for Pickup"
        hint="Prepared by local supply stores. Claim an order to assign it to your delivery queue."
        count={available.length}
      >
        {available.length === 0 ? (
          <Empty title="No packages awaiting pickup right now">
            Check back shortly as stores prepare incoming customer orders.
          </Empty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {available.map((o) => (
              <Card key={o.id} className="flex flex-col gap-3.5 border-l-4 border-l-gold">
                <div className="flex items-start justify-between gap-3">
                  <Items items={o.items} />
                  <span className="shrink-0 rounded-lg bg-gold-soft border border-gold/20 px-2.5 py-1 text-xs font-bold text-gold font-mono tabular-nums">
                    {money(o.totalAmount)}
                  </span>
                </div>

                <Route s={stop(o)} />

                <form action={acceptDelivery.bind(null, o.id)} className="mt-auto pt-2 border-t border-line/60">
                  <SubmitButton className={`${btn} w-full h-11 text-xs`}>
                    <span>Claim &amp; Dispatch Delivery</span>
                    <ArrowRight className="h-4 w-4" />
                  </SubmitButton>
                </form>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Historical Completed Deliveries */}
      {done.length > 0 && (
        <Section title="Delivery Fulfillment History">
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
            {done.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
                <div>
                  <p className="font-semibold text-ink">
                    {o.shop.name} &rarr; {o.customer.name}
                  </p>
                  <p className="text-mute font-mono text-[11px] truncate">{o.deliveryAddress}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink font-mono tabular-nums">
                    {money(o.totalAmount)}
                  </span>
                  <Badge tone="good" dot>
                    {orderStatusLabel(o.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
