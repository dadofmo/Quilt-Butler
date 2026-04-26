// Lovable's vite config wrapper. We disable the Cloudflare plugin and tell
// TanStack Start to build for Vercel so this app can be deployed there.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    target: "vercel",
  },
});
