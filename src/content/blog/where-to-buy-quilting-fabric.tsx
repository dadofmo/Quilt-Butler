import { Link } from "react-router-dom";
import type { BlogPost } from "./types";

const title = "Where (and How) to Buy Quilting Fabric: A Beginner's Guide";

const CONNECTING_THREADS_URL = "http://bit.ly/3T7y95j";

const renderContent = () => (
  <div className="space-y-8">
    <p className="text-lg leading-relaxed text-foreground">
      Walk into a quilt shop or scroll a fabric site for the first time and you'll quickly notice
      something: fabric doesn't just come "by the yard." There's a whole vocabulary of bundles,
      cuts, and pre-packaged options — and knowing what they actually are can save you money, save
      you cutting time, and help you pick the right option for whatever you're making. Here's the
      full rundown.
    </p>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Buying by the Yard (Off the Bolt)
      </h2>
      <p>
        This is the classic option: fabric wound around a bolt, cut to whatever length you need,
        usually sold in 42"–44" widths (called WOF, or "width of fabric"). Buying yardage gives you
        complete control — you decide exactly how much you need for a specific project, which is
        especially useful once you already know your exact yardage requirement. (This is exactly
        what{" "}
        <Link to="/" className="text-primary hover:underline">
          QuiltButler's calculator
        </Link>{" "}
        solves for — pick your pattern and size, and it tells you precisely how much of each fabric
        to ask for at the counter, so you're not guessing or over-buying.)
      </p>
      <p>
        Yardage is the right call when your quilt uses just 1–4 fabrics and you want full control
        over exactly how much of each you're bringing home.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Precuts: Buying in Bundles
      </h2>
      <p>
        Precuts are fabric that's already been cut into standard shapes and sizes — usually a
        coordinated bundle pulled from one fabric collection, so all the prints are designed to work
        together right out of the package. They save cutting time and are a low-commitment way to
        try a wider variety of prints than you'd normally buy individually. Many of the names below
        were popularized by Moda Fabrics, but you'll find similar bundles from other manufacturers
        under slightly different names — the shapes and sizes are what matter most.
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Layer Cake</strong> — 10" × 10" squares
        </li>
        <li>
          <strong>Charm Pack</strong> — 5" × 5" squares
        </li>
        <li>
          <strong>Mini Charms</strong> — 2½" × 2½" squares
        </li>
        <li>
          <strong>Jelly Roll</strong> — 2½" × 44" strips
        </li>
        <li>
          <strong>Honey Bun</strong> — 1½" × 44" strips
        </li>
        <li>
          <strong>Fat Quarter (FQ)</strong> — 18" × 22" (a quarter-yard cut differently than a
          standard quarter-yard, so it's more useful for larger squares — see our{" "}
          <Link to="/blog/quilting-terms-glossary-for-beginners" className="text-primary hover:underline">
            quilting terms glossary
          </Link>{" "}
          for more on this one)
        </li>
        <li>
          <strong>Fat Eighth (F8)</strong> — 9" × 22"
        </li>
        <li>
          <strong>Honeycomb</strong> — 6" hexagons
        </li>
        <li>
          <strong>Turnovers</strong> — 6" triangles
        </li>
      </ul>
      <p>
        Precuts are especially handy for scrappy, multi-fabric blocks — a bundle of 20–40
        coordinated prints gives you instant variety without buying two dozen individual yardage
        cuts. (It's also why we built jelly-roll and fat-quarter-friendly options into select
        QuiltButler patterns like Rail Fence and Simple Squares — so you can plug a bundle straight
        in without doing the size math yourself.)
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Other Ways to Buy Fabric
      </h2>
      <p>
        <strong>Local quilt shops (LQS).</strong> Nothing beats seeing and feeling fabric in person
        before you commit, and most local shops will cut any yardage you need right at the counter.
        It's also the best way to get real, in-person advice if you're unsure about a color pairing.
      </p>
      <p>
        <strong>Big-box and craft store chains.</strong> Convenient and often less expensive,
        especially for backing fabric or beginner projects where an exact print match matters less.
      </p>
      <p>
        <strong>Online fabric retailers.</strong> A huge and growing category — many specialize in
        specific collections, precuts, or price points you won't find locally. One we're happy to
        recommend directly:
      </p>
      <p>
        <strong>Connecting Threads</strong> — a well-stocked online retailer offering both yardage
        and a wide range of precuts.{" "}
        <a
          href={CONNECTING_THREADS_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          Shop Connecting Threads
        </a>
        . (Affiliate link — we may earn a small commission if you shop through it, at no extra cost
        to you.)
      </p>
      <p>
        <strong>Your own stash (or a friend's).</strong> Never underestimate leftover fabric from
        past projects, or a swap with another quilter. Scrappy quilts — like a scrappy Bow Tie or
        Hourglass — are practically built for using up what you already have.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Which Option Is Right for Your First Quilt?
      </h2>
      <p>
        If you're making a simple, 2–3 fabric quilt, buying exact yardage is usually the most
        straightforward choice — especially once you know your precise numbers going in. If you're
        drawn to a scrappier, more varied look, a fat quarter bundle or charm pack is a great
        low-risk way to get a whole coordinated palette in one purchase, without committing to a
        full yard of each print.
      </p>
      <p>
        Either way, the fabric-buying step gets a lot less intimidating once you already know your
        numbers.
      </p>
    </section>

    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-xl font-semibold text-card-foreground">Know your numbers first</h3>
      <p className="mt-2 text-muted-foreground">
        Head to QuiltButler to pick a pattern and get your exact yardage, cutting diagram, and
        shopping list before you ever set foot in a shop.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Get your yardage
      </Link>
    </div>
  </div>
);

const post: BlogPost = {
  slug: "where-to-buy-quilting-fabric",
  title,
  description:
    "A beginner's guide to buying quilting fabric: yardage off the bolt, precut bundles (jelly rolls, charm packs, fat quarters), local quilt shops, and online retailers.",
  publishedAt: "2026-08-20",
  tags: [
    "buying fabric",
    "quilting fabric",
    "precuts",
    "jelly roll",
    "fat quarter",
    "beginner quilting",
  ],
  excerpt:
    "Yardage, jelly rolls, charm packs, fat quarters — here's what every way of buying quilting fabric actually means, and which one fits your first quilt.",
  readingTimeMinutes: 6,
  renderContent,
};

export default post;
