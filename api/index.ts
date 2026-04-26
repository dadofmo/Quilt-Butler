// Vercel serverless function entry point.
// This re-exports the SSR handler that `vite build` produces in
// dist/server/server.js so Vercel can route every non-static request
// through the TanStack Start server.
//
// The build script at the project root runs `vite build`, which creates
// dist/server/server.js. Vercel then bundles this file as a Node.js
// serverless function.
//
// @ts-expect-error - resolved at deploy time after `vite build` runs.
export { default } from "../dist/server/server.js";
