// Freemius paywall configuration.
// To go live: change FREEMIUS_MODE from "sandbox" to "live". That's it.

export const FREEMIUS_MODE: "sandbox" | "live" = "live";

export const FREEMIUS_CONFIG = {
  product_id: "30617",
  product_slug: "quilt-butler",
  plan_id: "50283",
  pricing_id: "66203",
  public_key: "pk_f993d14743e7f27a372ff2a194da1",
  // Display-only — the actual price charged is whatever you set in the
  // Freemius dashboard for the pricing above.
  display_price: "$7.99",
} as const;

// Hosted Freemius self-service page that emails a customer their license
// key based on the email address used at purchase.
export const FREEMIUS_LICENSE_RECOVERY_URL = `https://dashboard.freemius.com/license-recovery/${FREEMIUS_CONFIG.product_id}/${FREEMIUS_CONFIG.product_slug}/`;
