import { Wrench, Hammer, Zap, Paintbrush, LayoutGrid, AppWindow, HelpCircle } from "lucide-react";
import type { ComponentType } from "react";

export const TRADE_ICONS: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  PLUMBER: Wrench,
  CARPENTER: Hammer,
  ELECTRICIAN: Zap,
  PAINTER: Paintbrush,
  TILE_MAN: LayoutGrid,
  WINDOW_MAN: AppWindow,
};

export function TradeIcon({ trade, className = "w-5 h-5", strokeWidth = 1.75 }: { trade: string; className?: string; strokeWidth?: number }) {
  const Icon = TRADE_ICONS[trade] ?? HelpCircle;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
