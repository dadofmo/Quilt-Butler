import { Link } from "react-router-dom";
import { FREEMIUS_LICENSE_RECOVERY_URL } from "@/lib/freemius-config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link to="/terms" className="hover:text-foreground hover:underline">
            Terms
          </Link>
          <span aria-hidden>·</span>
          <Link to="/privacy" className="hover:text-foreground hover:underline">
            Privacy
          </Link>
          <span aria-hidden>·</span>
          <a
            href="mailto:quiltbutler@gmail.com"
            className="hover:text-foreground hover:underline"
          >
            Support
          </a>
          <span aria-hidden>·</span>
          <a
            href={FREEMIUS_LICENSE_RECOVERY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            Recover license
          </a>
        </nav>
        <p className="text-xs">© QuiltButler</p>
      </div>
    </footer>
  );
}
