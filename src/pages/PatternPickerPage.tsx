import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { StepShell } from "@/components/StepShell";
import { PatternThumb } from "@/components/PatternThumb";
import { PATTERNS, getPattern } from "@/lib/patterns";
import { setPlanner } from "@/lib/planner-store";
import { UnlockModal } from "@/components/UnlockModal";
import { isUnlocked } from "@/lib/license";
import { Lock } from "lucide-react";

import quiltButlerLogo from "@/assets/quilt-butler-logo.webp";
import jellyRollBadge from "@/assets/jelly-roll-badge.webp";
import fatQuarterBadge from "@/assets/fat-quarter-badge.webp";

const THUMB_PX = 110;
const BADGE_PX = 70; // 50% bigger than the prior ~46px badge



export default function PatternPicker() {
  return (
    <>
      <Helmet>
        <title>QuiltButler — Free Quilt Planner & Fabric Calculator</title>
        <meta name="description" content="Free quilt planner with exact yardage, cutting diagrams, cost estimates, and a fabric visualizer. 40+ patterns, no login required." />
        <link rel="canonical" href="https://quiltbutler.com/" />
        <link rel="preload" as="image" href={quiltButlerLogo} fetchPriority="high" />
        <meta property="og:title" content="QuiltButler — Free Quilt Planner & Fabric Calculator" />
        <meta property="og:description" content="Free quilt planner with exact yardage, cutting diagrams, cost estimates, and a fabric visualizer. 40+ patterns, no login required." />
        <meta property="og:url" content="https://quiltbutler.com/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "QuiltButler",
          "url": "https://quiltbutler.com/",
          "description": "Free quilt planner with exact yardage, cutting diagrams, cost estimates, and a fabric visualizer. 40+ patterns, no login required.",
          "applicationCategory": "DesignApplication",
          "operatingSystem": "Any",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        })}</script>
      </Helmet>

      <PatternPickerInner />
    </>
  );
}

function PatternPickerInner() {
  const navigate = useNavigate();
  const [pendingPattern, setPendingPattern] = useState<(typeof PATTERNS)[number]["id"] | null>(null);

  const choose = (id: (typeof PATTERNS)[number]["id"]) => {
    const pattern = getPattern(id);
    if (!pattern) return;
    const assignments: Record<string, import("@/lib/planner-store").FabricKey> = {};
    // Seed every section EXCEPT the border. The border default is resolved
    // dynamically (getEffectiveBorderDefault) so it always matches the
    // accent swatch shown on FabricsPage — and stays consistent if the user
    // toggles sashing on/off later.
    pattern.sections.forEach((s) => {
      if (s.id === "border") return;
      assignments[s.id] = s.defaultFabric;
    });
    setPlanner({ pattern: id, assignments });
    navigate("/size");
  };

  const handleTileClick = (id: (typeof PATTERNS)[number]["id"]) => {
    if (isUnlocked(id)) {
      choose(id);
    } else {
      setPendingPattern(id);
    }
  };


  return (
    <StepShell step={1} title="">
      <div className="-mt-2 mb-4 flex justify-center sm:-mt-4">
        <img
          src={quiltButlerLogo}
          alt="QuiltButler quilt planner and fabric calculator logo"
          width={384}
          height={384}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="h-64 w-auto sm:h-80"
        />
      </div>
      <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">Pick a quilt pattern</h1>
      <p className="text-muted-foreground mt-2 text-base">Tap a tile to start planning your quilt.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
        {PATTERNS.map((p) => {
          const ready = p.hasMath;
          const locked = ready && !isUnlocked(p.id);
          return (
            <div key={p.id} className="flex flex-col items-center">
              <button
                onClick={() => ready && handleTileClick(p.id)}
                disabled={!ready}
                aria-disabled={!ready}
                aria-label={locked ? `${p.name} (locked)` : p.name}
                className={
                  "group relative flex w-full flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-ring " +
                  (ready
                    ? "hover:border-primary hover:-translate-y-0.5 hover:shadow-md"
                    : "cursor-not-allowed")
                }
              >
                <div
                  className={
                    "relative flex aspect-square w-full items-center justify-center rounded-lg bg-muted/50 p-3 " +
                    (ready ? "" : "opacity-40 grayscale")
                  }
                >
                  <PatternThumb pattern={p.id} size={THUMB_PX} />
                  {(p.id === "rail-fence" || p.id === "simple-squares") && (
                    <img
                      src={p.id === "rail-fence" ? jellyRollBadge : fatQuarterBadge}
                      alt={p.id === "rail-fence" ? "Jelly Roll Friendly" : "Fat Quarter Friendly"}
                      width={BADGE_PX}
                      height={BADGE_PX}
                      loading="lazy"
                      decoding="async"
                      className="pointer-events-none absolute -translate-x-1/2 translate-y-1/2"
                      style={{
                        width: BADGE_PX,
                        height: BADGE_PX,
                        left: `calc((100% - ${THUMB_PX}px) / 4)`,
                        bottom: `calc((100% - ${THUMB_PX}px) / 4)`,
                      }}
                    />
                  )}
                </div>

                <span
                  className={
                    "text-sm font-semibold leading-tight sm:text-base " +
                    (ready ? "text-foreground" : "text-muted-foreground")
                  }
                >
                  {p.name}
                </span>
                {!ready && (
                  <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-md border-2 border-primary bg-background/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-md">
                    Coming soon
                  </span>
                )}
                {locked && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
                  >
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            </div>
          );
        })}

      </div>
      <section className="mx-auto mt-16 max-w-2xl px-4 py-10 text-center sm:mt-20 sm:py-12">
        <p className="text-xs leading-relaxed text-muted-foreground/70 sm:text-sm">
          QuiltButler is an online quilt planning tool built for quilters of every skill level. Start free with the beginner-friendly Nine Patch, then unlock the full pattern library — Half Square Triangles, Snowball, Friendship Star, Bear Paw and more — with a single one-time purchase. Enter your quilt size and fabric choices to instantly receive exact yardage requirements, visual cutting diagrams, and a printable shopping list. Use the Quilt Visualizer to see how your fabric choices will look before you buy a single yard, estimate your total project cost with the built-in cost calculator, and get helpful quilting tips along the way. No login required — just open QuiltButler and get your complete quilt plan. Happy Quilting!
        </p>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground/70 sm:text-sm">
          Whatever you do, work at it with all of your heart
          <br />
          Colossians 3:23
        </p>
      </section>
      <UnlockModal
        open={pendingPattern !== null}
        onOpenChange={(o) => { if (!o) setPendingPattern(null); }}
        onUnlocked={() => {
          const id = pendingPattern;
          setPendingPattern(null);
          if (id) choose(id);
        }}
      />
    </StepShell>

  );
}
