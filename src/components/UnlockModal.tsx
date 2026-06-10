import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openCheckout, restoreCheckoutPageState } from "@/lib/checkout";
import { unlock, activateLicenseKey } from "@/lib/license";
import { FREEMIUS_CONFIG, FREEMIUS_LICENSE_RECOVERY_URL } from "@/lib/freemius-config";

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
  const [showSuccess, setShowSuccess] = useState(false);

  // Safety net: if this modal unmounts for any reason, make sure no
  // leftover scroll-lock styles (from Freemius or Radix) remain on body.
  useEffect(() => {
    return () => {
      restoreCheckoutPageState();
    };
  }, []);

  // Reset success state when the modal is re-opened.
  useEffect(() => {
    if (open) {
      setShowSuccess(false);
    }
  }, [open]);

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
      setShowSuccess(true);
      setTimeout(() => {
        setKeyValue("");
        setShowKeyInput(false);
        setShowSuccess(false);
        onUnlocked();
        onOpenChange(false);
      }, 2500);
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

        {showSuccess ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-lg font-semibold text-green-600">License activated!</p>
            <p className="text-sm text-muted-foreground">
              Save the email from Freemius with your license key — you'll need it to unlock QuiltButler on a new device or browser.
            </p>
          </div>
        ) : (
          <>
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
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(true)}
                    className="block text-sm text-primary underline-offset-2 hover:underline"
                  >
                    Already purchased? Enter your license key
                  </button>
                  <a
                    href={FREEMIUS_LICENSE_RECOVERY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Lost your license key? Recover it
                  </a>
                </div>
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
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      if (pasted) {
                        e.preventDefault();
                        setKeyValue(pasted.trim());
                        setKeyError(null);
                      }
                    }}
                    placeholder="sk_xxxxxxxxxxxxxxxxxxxxxxxxx"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={keyLoading}
                  />
                  {keyError && (
                    <div className="space-y-1">
                      <p role="alert" className="text-sm text-destructive">{keyError}</p>
                      <p className="text-xs text-muted-foreground">
                        Need help?{" "}
                        <a
                          href="mailto:quiltbutler@gmail.com?subject=QuiltButler%20license%20help"
                          className="underline underline-offset-2 hover:text-foreground"
                        >
                          Email support
                        </a>
                        {" "}or{" "}
                        <a
                          href={FREEMIUS_LICENSE_RECOVERY_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-foreground"
                        >
                          manage your devices
                        </a>.
                      </p>
                    </div>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
