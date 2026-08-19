import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-subject">SCIFORGE / 404</p>
        <h1 className="mt-4 font-display text-5xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The experiment you requested does not exist in this lab.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex rounded-md bg-subject px-4 py-2 text-sm font-medium text-subject-foreground"
        >
          Return to home
        </Link>
      </div>
    </div>
  );
}
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          This experiment hit an error
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Try resetting the route or return to the main laboratory.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-subject px-4 py-2 text-sm font-medium text-subject-foreground"
          >
            Try again
          </button>
          <Link
            to="/"
            className="rounded-md border border-border px-4 py-2 text-sm text-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SciForge — Experiment with Science" },
      {
        name: "description",
        content: "A premium interactive laboratory for exploring school-level science.",
      },
      { name: "author", content: "SciForge" },
      { property: "og:title", content: "SciForge — Experiment with Science" },
      { property: "og:description", content: "Change variables. Observe results. Understand why." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
function RootShell({ children }: { children: ReactNode }) {
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
function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <SiteHeader />
        <Outlet />
        <footer className="border-t border-border bg-background">
          <div className="container flex flex-col gap-3 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="font-display font-semibold text-foreground">SCIFORGE</span>
            <span>Interactive science infrastructure for curious minds.</span>
            <span className="font-mono">build / UI-01</span>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
