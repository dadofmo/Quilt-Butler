import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openCheckout } from "@/lib/checkout";
import { unlock, activateLicenseKey } from "@/lib/license";
import { FREEMIUS_CONFIG } from "@/lib/freemius-config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
};

export function UnlockModal({ open, onOpenChange, onUnlocked }: Props) {
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  // Safety net: if this modal unmounts for any reason, make sure no
  // leftover scroll-lock styles (from Freemius or Radix) remain on body.
  useEffect(() => {
    return () => {
      if (typeof document === "undefined") return;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.paddingRight = "";
      document.body.style.top = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const handleUnlock = async () => {
    setLoading(true);
    // Close our Radix dialog before opening the Freemius overlay so the
    // two scroll-lock systems don't tangle when the user closes Freemius.
    onOpenChange(false);
    try {
      await openCheckout({
        onSuccess: () => {
          unlock("purchase");
          onUnlocked();
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

  const handleActivateKey = async () => {
    setKeyError(null);
    setKeyLoading(true);
    const result = await activateLicenseKey(keyValue);
    setKeyLoading(false);
    if (result.ok) {
      setKeyValue("");
      setShowKeyInput(false);
      onUnlocked();
      onOpenChange(false);
    } else {
      setKeyError(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Unlock all quilt patterns</DialogTitle>
          <DialogDescription>
            One-time payment. Lifetime access — use your license key on up to 3 devices.
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

        <Button onClick={handleUnlock} disabled={loading || keyLoading} size="lg" className="mt-2 w-full">
          {loading ? "Opening checkout…" : "Unlock all patterns"}
        </Button>

        <div className="mt-2 border-t pt-3">
          {!showKeyInput ? (
            <button
              type="button"
              onClick={() => setShowKeyInput(true)}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Already purchased? Enter your license key
            </button>
          ) : (
            <div className="space-y-2">
              <label htmlFor="license-key" className="block text-sm font-medium text-foreground">
                License key
              </label>
              <p className="text-xs text-muted-foreground">
                Paste the key from your purchase email. You can use it on up to 3 devices.
              </p>
              <Input
                id="license-key"
                value={keyValue}
                onChange={(e) => { setKeyValue(e.target.value); setKeyError(null); }}
                placeholder="sk_xxxxxxxxxxxxxxxxxxxxxxxxx"
                autoComplete="off"
                spellCheck={false}
                disabled={keyLoading}
              />
              {keyError && (
                <p role="alert" className="text-sm text-destructive">{keyError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleActivateKey}
                  disabled={keyLoading || !keyValue.trim()}
                  className="flex-1"
                >
                  {keyLoading ? "Activating…" : "Activate"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowKeyInput(false); setKeyError(null); }}
                  disabled={keyLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
