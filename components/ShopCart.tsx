"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { placeOrder } from "@/actions/orders";
import { btn, btnGhost, inputCls } from "@/components/ui";
import { Plus, Minus, ShoppingBag, CheckCircle2, ArrowRight, X } from "lucide-react";

type Item = { id: string; name: string; description: string; price: number; available: boolean };
type Category = { id: string; name: string; items: Item[] };

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

export default function ShopCart({
  shopId,
  categories,
  defaultAddress,
  canOrder,
}: {
  shopId: string;
  categories: Category[];
  defaultAddress: string;
  canOrder: boolean;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [address, setAddress] = useState(defaultAddress);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(false);
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState(false);

  const all = useMemo(() => categories.flatMap((c) => c.items), [categories]);
  const lines = all.filter((i) => (qty[i.id] ?? 0) > 0);
  const total = lines.reduce((s, i) => s + i.price * qty[i.id], 0);
  const count = lines.reduce((n, i) => n + qty[i.id], 0);

  const change = (id: string, d: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(50, (q[id] ?? 0) + d)) }));

  function submit() {
    setError("");
    start(async () => {
      const res = await placeOrder(
        shopId,
        lines.map((i) => ({ itemId: i.id, quantity: qty[i.id] })),
        address,
        note,
      );
      if (res.ok) {
        setPlaced(true);
        setSheet(false);
        setQty({});
      } else {
        setError(res.error);
      }
    });
  }

  if (placed)
    return (
      <div className="rounded-2xl border border-good/30 bg-good-soft p-6 text-sm text-good">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-good" strokeWidth={2} />
          <p className="text-base font-bold text-good font-display">Order placed successfully!</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-good/90">
          The shop owner has received your order. Once prepared, a delivery rider will pick it up and deliver it to your address. You can track live progress from your dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard" className={btn}>
            Go to dashboard
          </Link>
          <button className={btnGhost} onClick={() => setPlaced(false)}>
            Order more items
          </button>
        </div>
      </div>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* Catalog & Categories */}
      <div className="space-y-8">
        {categories.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-mute text-center">
            This shop has not published any catalog items yet.
          </p>
        )}

        {categories.length > 1 && (
          <nav
            className="sticky top-16 z-10 -mx-1 flex gap-2 overflow-x-auto bg-paper/90 px-1 py-2 backdrop-blur-md"
            aria-label="Menu categories"
          >
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#menu-${c.id}`}
                className="shrink-0 rounded-full border border-line bg-card px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {c.name}
              </a>
            ))}
          </nav>
        )}

        {categories.map((c) => (
          <section key={c.id} id={`menu-${c.id}`} className="scroll-mt-24 space-y-3">
            <h3 className="text-lg font-bold tracking-tight text-ink font-display border-b border-line pb-2">
              {c.name}
            </h3>
            {c.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-4 text-xs text-mute">
                No items in this category.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {c.items.map((i) => {
                  const n = qty[i.id] ?? 0;
                  return (
                    <li
                      key={i.id}
                      className={`flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs transition-all ${
                        n > 0 ? "border-accent/40 bg-accent-soft/30" : "border-line"
                      } ${i.available ? "" : "opacity-60"}`}
                    >
                      <div className="mr-auto min-w-0 flex-1">
                        <p className="font-semibold text-sm text-ink leading-snug">{i.name}</p>
                        {i.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-mute leading-relaxed">
                            {i.description}
                          </p>
                        )}
                        <p className="mt-1.5 text-sm font-bold text-accent font-mono tabular-nums">
                          {rs(i.price)}
                        </p>
                      </div>

                      {!i.available ? (
                        <span className="rounded-full bg-elevated px-2.5 py-1 text-xs font-medium text-mute">
                          Out of stock
                        </span>
                      ) : canOrder ? (
                        n === 0 ? (
                          <button
                            aria-label={`Add ${i.name}`}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-xs transition-all hover:bg-accent-hover active:scale-[0.96]"
                            onClick={() => change(i.id, 1)}
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 rounded-xl border border-line bg-card p-0.5 shadow-xs">
                            <button
                              aria-label={`Remove one ${i.name}`}
                              className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-elevated hover:text-ink transition-colors"
                              onClick={() => change(i.id, -1)}
                            >
                              <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold font-mono tabular-nums text-ink">
                              {n}
                            </span>
                            <button
                              aria-label={`Add one ${i.name}`}
                              className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-elevated hover:text-ink transition-colors"
                              onClick={() => change(i.id, 1)}
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </div>
                        )
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Cart Summary (Desktop Sidebar & Mobile Drawer) */}
      {canOrder && (
        <aside
          aria-label="Your order"
          className={`space-y-4 border border-line bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:block lg:h-fit lg:rounded-2xl ${
            sheet
              ? "fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-line p-6 shadow-2xl"
              : "hidden"
          }`}
        >
          {/* Mobile Handle & Close */}
          <div className="flex items-center justify-between border-b border-line pb-3 lg:border-none lg:pb-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" strokeWidth={2} />
              <h3 className="font-bold text-base text-ink font-display">Your Order</h3>
            </div>
            <button
              className="rounded-lg p-1 text-mute hover:text-ink lg:hidden"
              onClick={() => setSheet(false)}
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {lines.length === 0 ? (
            <p className="text-xs text-mute py-4 text-center border border-dashed border-line rounded-xl">
              Select items from the catalog above.
            </p>
          ) : (
            <div className="space-y-3">
              <ul className="divide-y divide-line text-xs font-medium">
                {lines.map((i) => (
                  <li key={i.id} className="flex justify-between items-center py-2 gap-2">
                    <span className="text-ink truncate">
                      {qty[i.id]} × {i.name}
                    </span>
                    <span className="font-mono tabular-nums text-mute shrink-0">
                      {rs(i.price * qty[i.id])}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between border-t border-line pt-3 font-semibold text-sm text-ink">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-accent">{rs(total)}</span>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-mute">Delivery Address</span>
              <input
                className={inputCls}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address / area"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                Note for Shop / Rider (optional)
              </span>
              <input
                className={inputCls}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Gate code, instructions..."
                maxLength={300}
              />
            </label>
          </div>

          {error && <p className="text-xs font-medium text-bad">{error}</p>}

          <button
            className={`${btn} w-full`}
            disabled={pending || lines.length === 0}
            onClick={submit}
          >
            {pending ? (
              "Placing order..."
            ) : (
              <>
                <span>Place Order</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </aside>
      )}

      {/* Floating Mobile Order Bar */}
      {canOrder && count > 0 && !sheet && (
        <button
          onClick={() => setSheet(true)}
          className="fixed inset-x-4 bottom-20 z-20 flex items-center justify-between rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform active:scale-[0.98] lg:hidden"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-mono font-bold">
              {count} {count === 1 ? "item" : "items"}
            </span>
            <span>View Cart</span>
          </div>
          <span className="font-mono tabular-nums">{rs(total)}</span>
        </button>
      )}

      {sheet && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSheet(false)}
          aria-hidden
        />
      )}
    </div>
  );
}
