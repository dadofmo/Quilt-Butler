import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "QuiltButler — Plan smart. Cut confidently. Quilt beautifully." },
      { name: "description", content: "QuiltButler helps beginner quilters plan their projects and calculate fabric needs." },
      { name: "author", content: "QuiltButler" },
      { property: "og:title", content: "QuiltButler — Plan smart. Cut confidently. Quilt beautifully." },
      { property: "og:description", content: "QuiltButler helps beginner quilters plan their projects and calculate fabric needs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@QuiltButler" },
      { name: "twitter:title", content: "QuiltButler — Plan smart. Cut confidently. Quilt beautifully." },
      { name: "twitter:description", content: "QuiltButler helps beginner quilters plan their projects and calculate fabric needs." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9fd01655-861b-4fe9-bdf2-aa7f3227a531/id-preview-788a693a--e7fe8d01-c2f1-4ed0-a1f9-1d74f1fed8b4.lovable.app-1776819350085.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9fd01655-861b-4fe9-bdf2-aa7f3227a531/id-preview-788a693a--e7fe8d01-c2f1-4ed0-a1f9-1d74f1fed8b4.lovable.app-1776819350085.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Main app component — renders the active route via TanStack Router's <Outlet />
function RootComponent() {
  return <Outlet />;
}
