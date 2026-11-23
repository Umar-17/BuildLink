export const LABOUR_TYPES = ["PLUMBER", "CARPENTER", "ELECTRICIAN", "PAINTER", "TILE_MAN", "WINDOW_MAN"] as const;

export const labourLabel = (t: string) =>
  ({ PLUMBER: "Plumber", CARPENTER: "Carpenter", ELECTRICIAN: "Electrician", PAINTER: "Painter", TILE_MAN: "Tile man", WINDOW_MAN: "Window man" })[t] ??
  t;

export const money = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

export const mapsLink = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const jobStatusLabel = (s: string) =>
  ({
    OPEN: "Open for requests",
    PENDING_DIRECT: "Waiting for labour",
    ACCEPTED: "In progress",
    REJECTED: "Declined / cancelled",
    COMPLETED: "Completed",
  })[s] ?? s;

export const orderStatusLabel = (s: string) =>
  ({
    PENDING_SHOP: "Waiting for shop",
    READY_FOR_PICKUP: "Ready - finding rider",
    OUT_FOR_DELIVERY: "Rider assigned / on the way",
    DELIVERED: "Delivered",
    REJECTED: "Rejected by shop",
  })[s] ?? s;

export const ratingText = (rating: number, count: number) => (count === 0 ? "New" : `${rating.toFixed(1)} (${count})`);

export const TRADE_ICON: Record<string, string> = {
  PLUMBER: "🔧", CARPENTER: "🪚", ELECTRICIAN: "⚡", PAINTER: "🎨", TILE_MAN: "🧱", WINDOW_MAN: "🪟",
};

/* ---------- Shop opening hours (minutes from midnight, Pakistan time) ---------- */
const TZ = "Asia/Karachi";

export function minutesNow(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/** Handles shops that close after midnight (closesAt <= opensAt). */
export function isOpenNow(opensAt: number, closesAt: number, now = new Date()): boolean {
  const t = minutesNow(now);
  if (opensAt === closesAt) return true;
  return opensAt < closesAt ? t >= opensAt && t < closesAt : t >= opensAt || t < closesAt;
}

export const fmtTime = (min: number) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
export const toHHMM = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
export const fromHHMM = (v: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  return h > 23 || mi > 59 ? null : h * 60 + mi;
};

/** Rough "nearest" score: how many words of the user's address appear in the place's area/address. */
export function nearScore(userAddress: string, ...places: string[]): number {
  const words = Array.from(new Set(userAddress.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2)));
  const hay = places.join(" ").toLowerCase();
  return words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
}

/** Only http(s) links are accepted for photos. Returns null if invalid, "" if empty. */
export function cleanUrl(v: string): string | null {
  const s = v.trim();
  if (!s) return "";
  if (s.length > 500) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? s : null;
  } catch {
    return null;
  }
}

/* ---------- Contact links ---------- */
export const telLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
/** WhatsApp needs an international number. Pakistani numbers like 0300 1234567 become 923001234567. */
export const waLink = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return `https://wa.me/${d.startsWith("0") ? "92" + d.slice(1) : d}`;
};
