// Lovable's vite config wrapper. Cloudflare's plugin is disabled so this
// app can be built and deployed elsewhere (e.g. Vercel) without pulling in
// Cloudflare Workers-specific build output.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
});
