import { ShoppingBag } from "lucide-react";

const SHOP_URL =
  "https://www.awin1.com/cread.php?awinmid=89111&awinaffid=2871423&ued=https%3A%2F%2Fwww.connectingthreads.com%2F";

/**
 * Shared affiliate shop card shown on the Assign Fabrics page for EVERY pattern.
 * Rendered globally in FabricsPage so no per-pattern wiring is needed — any
 * future pattern automatically inherits this card.
 */
export function AffiliateShopCard() {
  return (
    <div className="bg-card mb-6 flex items-center justify-between gap-4 rounded-xl border-2 border-border p-4">
      <div className="min-w-0">
        <div className="text-foreground text-base font-semibold">
          Don&apos;t have your fabric yet?
        </div>
        <div className="text-muted-foreground mt-0.5 text-xs">
          Affiliate link — we may earn a commission
        </div>
      </div>
      <a
        href={SHOP_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="border-primary text-primary hover:bg-primary/10 focus:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 bg-transparent px-4 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
      >
        <ShoppingBag className="h-4 w-4" />
        Shop fabric
      </a>
    </div>
  );
}
