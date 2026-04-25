import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  step: 1 | 2 | 3 | 4;
  title: string;
  subtitle?: string;
  backTo?: string;
  children: ReactNode;
}

export function StepShell({ step, title, subtitle, backTo, children }: Props) {
  const pct = (step / 4) * 100;
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          {backTo ? (
            <Link
              to={backTo}
              className="text-foreground hover:text-primary inline-flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          ) : (
            <span className="text-primary text-base font-semibold tracking-tight">QuiltButler</span>
          )}
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Step {step} of 4
          </span>
        </div>
        <div className="bg-muted h-1.5 w-full">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:pt-10">
        {title && <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">{title}</h1>}
        {subtitle && <p className="text-muted-foreground mt-2 text-base">{subtitle}</p>}
        <div className={title || subtitle ? "mt-6 sm:mt-8" : ""}>{children}</div>
      </main>
    </div>
  );
}
