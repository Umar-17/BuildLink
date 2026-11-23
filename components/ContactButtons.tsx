import { isValidElement, type ComponentType, type ReactNode } from "react";
import { btn, btnGhost } from "@/components/ui";
import { mapsLink, telLink, waLink } from "@/lib/constants";
import { Phone, MessageSquare, Navigation, type LucideIcon } from "lucide-react";

/** Call / WhatsApp / Directions with monochrome vector icons. */
export default function ContactButtons({ phone, address }: { phone?: string; address?: string }) {
  if (!phone && !address) return null;
  return (
    <div className="flex flex-wrap gap-2.5 pt-2">
      {phone && (
        <a href={telLink(phone)} className={`${btn} h-10 px-4 text-xs`}>
          <Phone className="h-3.5 w-3.5" strokeWidth={2} />
          <span>Call Directly</span>
        </a>
      )}
      {phone && (
        <a
          href={waLink(phone)}
          target="_blank"
          rel="noreferrer"
          className={`${btnGhost} h-10 px-4 text-xs`}
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
          <span>WhatsApp Chat</span>
        </a>
      )}
      {address && (
        <a
          href={mapsLink(address)}
          target="_blank"
          rel="noreferrer"
          className={`${btnGhost} h-10 px-4 text-xs`}
        >
          <Navigation className="h-3.5 w-3.5" strokeWidth={2} />
          <span>Get Directions</span>
        </a>
      )}
    </div>
  );
}

export function InfoGrid({
  items,
}: {
  items: {
    icon: LucideIcon | ComponentType<{ className?: string; strokeWidth?: number }> | ReactNode;
    label: string;
    value: ReactNode;
  }[];
}) {
  return (
    <dl className="grid gap-2.5 sm:grid-cols-2">
      {items.map((i) => {
        const renderIcon = () => {
          if (isValidElement(i.icon)) return i.icon;
          if (typeof i.icon === "function" || typeof i.icon === "object") {
            const Icon = i.icon as ComponentType<{ className?: string; strokeWidth?: number }>;
            return <Icon className="h-4 w-4" strokeWidth={1.75} />;
          }
          return null;
        };

        return (
          <div
            key={i.label}
            className="flex items-start gap-3 rounded-xl border border-line bg-elevated/50 px-3.5 py-3 text-xs"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-card text-brand border border-line">
              {renderIcon()}
            </span>
            <div className="min-w-0 flex-1">
              <dt className="font-semibold text-ink uppercase tracking-wider text-[11px] text-mute mb-0.5">
                {i.label}
              </dt>
              <dd className="break-words font-medium text-ink">{i.value}</dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
