// Lovable's vite config wrapper. We disable Cloudflare and switch TanStack
// Start into SPA mode so the build emits a static client bundle that can be
// deployed to Vercel (or any static host) with no Node server required.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    spa: {
      enabled: true,
    },
  },
});
