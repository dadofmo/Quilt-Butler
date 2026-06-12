import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openCheckout, restoreCheckoutPageState } from "@/lib/checkout";
import {
  unlock,
  activateLicenseKey,
  listLicenseDevices,
  swapLicenseDevice,
  type LicenseDevice,
} from "@/lib/license";
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
  const [devices, setDevices] = useState<LicenseDevice[] | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);

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
      setDevices(null);
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

  const finishSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setKeyValue("");
      setShowKeyInput(false);
      setShowSuccess(false);
      setDevices(null);
      onUnlocked();
      onOpenChange(false);
    }, 2500);
  };

  const handleActivateKey = async () => {
    setKeyError(null);
    setKeyLoading(true);
    const result = await activateLicenseKey(keyValue);
    if (result.ok) {
      setKeyLoading(false);
      finishSuccess();
      return;
    }
    // Limit reached → fetch device list and show picker instead of dead-end error.
    if (result.reason === "limit_reached") {
      const list = await listLicenseDevices(keyValue);
      setKeyLoading(false);
      if (list.ok) {
        setDevices(list.devices);
        setKeyError(result.error);
      } else {
        setKeyError(list.error);
      }
      return;
    }
    setKeyLoading(false);
    setKeyError(result.error);
  };

  const handleSwapDevice = async (installId: string) => {
    setKeyError(null);
    setSwappingId(installId);
    const result = await swapLicenseDevice(keyValue, installId);
    setSwappingId(null);
    if (result.ok) {
      finishSuccess();
    } else {
      setKeyError(result.error);
    }
  };

  const formatLastSeen = (iso: string | null): string => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "last used today";
    if (days === 1) return "last used yesterday";
    if (days < 30) return `last used ${days} days ago`;
    return `last used ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
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
                  {devices && devices.length > 0 && (
                    <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3">
                      <p className="text-sm font-medium text-foreground">
                        Your license is already used on {devices.length} device{devices.length === 1 ? "" : "s"}.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pick one to sign out so you can use this device instead.
                      </p>
                      <ul className="space-y-2 pt-1">
                        {devices.map((d) => {
                          const seen = formatLastSeen(d.last_seen);
                          const isSwapping = swappingId === d.install_id;
                          return (
                            <li
                              key={d.install_id}
                              className="flex items-center justify-between gap-2 rounded border border-border bg-background p-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-foreground">{d.title}</p>
                                {seen && <p className="text-xs text-muted-foreground">{seen}</p>}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSwapDevice(d.install_id)}
                                disabled={swappingId !== null}
                              >
                                {isSwapping ? "Swapping…" : "Use this device instead"}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {keyError && !devices && (
                    <div className="space-y-1">
                      <p role="alert" className="text-sm text-destructive">{keyError}</p>
                      <p className="text-xs text-muted-foreground">
                        <a
                          href={FREEMIUS_LICENSE_RECOVERY_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-foreground"
                        >
                          Recover your license key
                        </a>
                      </p>
                    </div>
                  )}
                  {keyError && devices && (
                    <p role="alert" className="text-sm text-destructive">{keyError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleActivateKey}
                      disabled={keyLoading || !keyValue.trim() || swappingId !== null || (devices?.length ?? 0) > 0}
                      className="flex-1"
                    >
                      {keyLoading ? "Activating…" : "Activate"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setShowKeyInput(false); setKeyError(null); setDevices(null); }}
                      disabled={keyLoading || swappingId !== null}
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
