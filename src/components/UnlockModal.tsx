import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openCheckout } from "@/lib/checkout";
import { applyBypassCode, unlock } from "@/lib/license";
import { FREEMIUS_CONFIG } from "@/lib/freemius-config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
};

export function UnlockModal({ open, onOpenChange, onUnlocked }: Props) {
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
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

  const handleApplyCode = () => {
    if (applyBypassCode(code)) {
      setCodeError(null);
      onUnlocked();
      onOpenChange(false);
    } else {
      setCodeError("That code doesn't work. Double-check and try again.");
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

        <div className="mt-1 text-center">
          {!showCode ? (
            <button
              type="button"
              onClick={() => setShowCode(true)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Have a code?
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code"
                  aria-label="Access code"
                />
                <Button variant="outline" onClick={handleApplyCode}>Apply</Button>
              </div>
              {codeError && <p className="text-left text-xs text-destructive">{codeError}</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
