import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { openCheckout } from "@/lib/checkout";
import { unlock } from "@/lib/license";
import { FREEMIUS_CONFIG } from "@/lib/freemius-config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
};

export function UnlockModal({ open, onOpenChange, onUnlocked }: Props) {
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    try {
      await openCheckout({
        onSuccess: () => {
          unlock("purchase");
          onUnlocked();
          onOpenChange(false);
        },
        onCancel: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Unlock all quilt patterns</DialogTitle>
          <DialogDescription>
            One-time payment. Lifetime access on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">{FREEMIUS_CONFIG.display_price}</span>
          <span className="text-sm text-muted-foreground">one-time</span>
        </div>

        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex gap-2"><span aria-hidden>✓</span> Every quilt pattern, now and forever</li>
          <li className="flex gap-2"><span aria-hidden>✓</span> Exact yardage, cutting diagrams, cost estimates</li>
          <li className="flex gap-2"><span aria-hidden>✓</span> All future patterns added at no extra cost</li>
        </ul>

        <Button onClick={handleUnlock} disabled={loading} size="lg" className="mt-2 w-full">
          {loading ? "Opening checkout…" : "Unlock all patterns"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
