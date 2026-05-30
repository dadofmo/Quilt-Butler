// Freemius paywall configuration.
// To go live: change FREEMIUS_MODE from "sandbox" to "live". That's it.

export const FREEMIUS_MODE: "sandbox" | "live" = "sandbox";

export const FREEMIUS_CONFIG = {
  product_id: "30617",
  plan_id: "50283",
  pricing_id: "66203",
  public_key: "pk_f993d14743e7f27a372ff2a194da1",
  // Display-only — the actual price charged is whatever you set in the
  // Freemius dashboard for the pricing above.
  display_price: "$7.99",
} as const;
