import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { StepShell } from "@/components/StepShell";
import { PatternThumb } from "@/components/PatternThumb";
import { FabricRollIcon, PATTERN_DIFFICULTY } from "@/components/FabricRollIcon";
import { PATTERNS, getPattern } from "@/lib/patterns";
import { setPlanner } from "@/lib/planner-store";
import quiltButlerLogo from "@/assets/quilt-butler-logo.webp";

export default function PatternPicker() {
  return (
    <>
      <Helmet>
        <title>QuiltButler — Free Quilt Planner | Yardage, Cutting Diagrams & Fabric Visualizer</title>
        <meta name="description" content="Free quilt planning tool for all skill levels. Choose from 10+ patterns, get exact yardage requirements, visual cutting diagrams, a project cost estimate, and see your fabric choices come to life before you buy. No login required." />
        <link rel="canonical" href="https://quiltbutler.com/" />
        <meta property="og:title" content="QuiltButler — Free Quilt Planner | Yardage, Cutting Diagrams & Fabric Visualizer" />
        <meta property="og:description" content="Free quilt planning tool for all skill levels. Choose from 10+ patterns, get exact yardage requirements, visual cutting diagrams, a project cost estimate, and see your fabric choices come to life before you buy. No login required." />
        <meta property="og:url" content="https://quiltbutler.com/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "QuiltButler",
          "url": "https://quiltbutler.com/",
          "description": "Free quilt planning tool for all skill levels. Choose from 10+ patterns, get exact yardage requirements, visual cutting diagrams, a project cost estimate, and see your fabric choices come to life before you buy. No login required.",
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

  const choose = (id: (typeof PATTERNS)[number]["id"]) => {
    const pattern = getPattern(id);
    if (!pattern) return;
    const assignments: Record<string, import("@/lib/planner-store").FabricKey> = {};
    pattern.sections.forEach((s) => (assignments[s.id] = s.defaultFabric));
    setPlanner({ pattern: id, assignments });
    navigate("/size");
  };

  return (
    <StepShell step={1} title="">
      <div className="-mt-2 mb-4 flex justify-center sm:-mt-4">
        <img
          src={quiltButlerLogo}
          alt="QuiltButler quilt planner and fabric calculator logo"
          width={900}
          height={600}
          fetchPriority="high"
          className="h-auto w-full max-w-sm sm:max-w-md"
        />
      </div>
      <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">Pick a quilt pattern</h1>
      <p className="text-muted-foreground mt-2 text-base">Tap a tile to start planning your quilt.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
        {PATTERNS.map((p) => {
          const ready = p.hasMath;
          return (
            <button
              key={p.id}
              onClick={() => ready && choose(p.id)}
              disabled={!ready}
              aria-disabled={!ready}
              className={
                "group relative flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-ring " +
                (ready
                  ? "hover:border-primary hover:-translate-y-0.5 hover:shadow-md"
                  : "cursor-not-allowed")
              }
            >
              <div
                className={
                  "flex aspect-square w-full items-center justify-center rounded-lg bg-muted/50 p-3 " +
                  (ready ? "" : "opacity-40 grayscale")
                }
              >
                <PatternThumb pattern={p.id} size={110} />
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
            </button>
          );
        })}
      </div>
      <section className="mx-auto mt-16 max-w-2xl px-4 py-10 text-center sm:mt-20 sm:py-12">
        <p className="text-xs leading-relaxed text-muted-foreground/70 sm:text-sm">
          QuiltButler is a free online quilt planning tool built for quilters of every skill level. Choose from multiple quilt patterns — from beginner-friendly Nine Patch and Half Square Triangles to more complex designs — with new patterns added regularly. Enter your quilt size and fabric choices to instantly receive exact yardage requirements, visual cutting diagrams, and a printable shopping list. Use the Quilt Visualizer to see how your fabric choices will look before you buy a single yard. Estimate your total project cost with the built-in cost calculator, and get helpful quilting tips along the way. No login required — just open QuiltButler and get your complete quilt plan. Happy Quilting!
        </p>
      </section>
    </StepShell>
  );
}
