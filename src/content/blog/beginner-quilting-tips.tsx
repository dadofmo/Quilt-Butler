import { Link } from "react-router-dom";
import type { BlogPost } from "./types";

const title = "10 Quilting Tips Every Beginner Should Know Before Their First Project";

const renderContent = () => (
  <div className="space-y-8">
    <p className="text-lg leading-relaxed text-foreground">
      Quilting has a learning curve, but most of the mistakes that trip up new quilters are
      avoidable once you know what to watch for. Here are ten habits worth building from your very
      first block — the kind of things experienced quilters wish someone had told them on day one.
    </p>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        1. Master the "Scant" ¼" Seam
      </h2>
      <p>
        A true ¼" seam is often just slightly too thick for piecing. When fabric folds over at the
        seam line, the thread and fold itself eat up a sliver of space — and over a 10" block, that
        tiny loss compounds into blocks that don't line up.
      </p>
      <p>
        A scant ¼" seam is just one or two thread-widths narrower than a true ¼". Before starting
        any project, sew three 2" squares together in a row, press, and measure the strip — it should
        measure exactly 5" (2" + 2" + 2" − two seam allowances = 5"). If it doesn't, adjust your seam
        guide until it does. A strip of painter's tape on your machine's throat plate makes a simple,
        reliable seam guide.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        2. Press, Don't Iron
      </h2>
      <p>
        Ironing involves sliding the iron back and forth — which stretches woven cotton fibers
        (especially along bias cuts) and distorts straight edges.
      </p>
      <p>
        Pressing means lifting the iron straight up, placing it on the seam, holding for a few
        seconds, and lifting straight back up — no sliding. Press seams flat first to set the
        stitches, then press them open or to one side.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        3. Square Up Blocks as You Go
      </h2>
      <p>
        Small errors compound fast. If your first block is off by ⅛", your fourth block can be off
        by half an inch by the time you sew them together.
      </p>
      <p>
        Trim and "square up" each block to its exact intended size using a clear acrylic ruler right
        after piecing it — don't wait until all your blocks are finished to discover they don't
        match. (This is exactly what{" "}
        <Link to="/" className="text-primary hover:underline">
          QuiltButler's cutting diagrams
        </Link>{" "}
        are built for — every piece size is calculated up front, so you always know the exact
        dimension to square up to.)
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        4. Nest Your Seams for Crisp Points
      </h2>
      <p>
        To get corners and intersections to line up perfectly without extra bulk, press seam
        allowances of adjacent rows in opposite directions (Row 1 seams left, Row 2 seams right). When
        you pin the rows together, the seams naturally "nest" or lock against each other before you
        stitch — giving you sharp, flat intersections instead of lumpy ones.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        5. Know When (and When Not) to Pre-Wash
      </h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Pre-cut fabrics (jelly rolls, layer cakes, charm packs):</strong> never pre-wash.
          They'll fray into a tangled mess and ruin your precise shapes.
        </li>
        <li>
          <strong>Yardage:</strong> pre-wash if you're combining high-contrast colors (like bright
          red next to crisp white) to prevent color bleed, or if you're using a lower-grade cotton
          prone to uneven shrinking.
        </li>
      </ul>
      <p>
        If you skip pre-washing yardage, toss 2–3 color-catcher sheets into the machine the first
        time you wash the finished quilt, just in case.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        6. Starch Before You Cut
      </h2>
      <p>
        Spraying yardage with fabric starch before cutting makes it stiff, almost like paper — which
        prevents bias edges from stretching out of shape as you handle them, and leads to noticeably
        sharper points when piecing. It's a small extra step that pays off every time you sew a seam.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        7. Invest in the "Big Three" Starter Tools
      </h2>
      <p>
        You don't need every gadget on the shelf, but these three are worth not skimping on:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Self-healing cutting mat</strong> — an 18" × 24" size is a good starting point.
        </li>
        <li>
          <strong>45mm rotary cutter</strong> — easier to control than smaller or larger blades for
          beginners. Change the blade more often than you think you need to; a dull blade slips and
          causes jagged cuts. (And always retract or close the blade guard the moment you set it down
          — an open rotary blade is genuinely the most common way new quilters get cut.)
        </li>
        <li>
          <strong>Clear 6" × 24" acrylic ruler</strong> — the most versatile size for cutting strips
          and squaring up yardage.
        </li>
      </ul>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        8. Read the Whole Pattern Before You Cut Anything
      </h2>
      <p>
        It's tempting to start cutting the moment you pick a block, but reading through the entire
        pattern first — every piece, every step — means you understand how the pieces fit together
        before you commit scissors to fabric. Cutting as you go is one of the most common ways
        beginners end up with mismatched piece counts or the wrong fabric in the wrong spot.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        9. Chain Piece for Speed and Accuracy
      </h2>
      <p>
        Instead of lifting the presser foot, cutting thread, and restarting for every pair of patches,
        stack your cut pieces and feed them continuously under the needle, one pair after another,
        without cutting the thread in between. This forms a connected chain of pieces — it saves
        thread, saves time, and keeps your machine from "eating" the corners of your fabric at the
        start of a seam.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        10. Embrace the Crinkle and Enjoy the Process
      </h2>
      <p>
        "If a mistake won't be noticed from a galloping horse, don't worry about it."
      </p>
      <p>
        Beginners often get discouraged by small misalignments. Here's the secret: once your quilt is
        layered, quilted, and run through the washer and dryer, the fabric shrinks slightly and
        creates that beloved classic quilt "crinkle" — which quietly hides tiny piecing imperfections.
        Perfection isn't the goal. A finished quilt made with care always beats an unfinished one made
        with perfect corners.
      </p>
    </section>

    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-xl font-semibold text-card-foreground">
        Ready to put these tips into practice?
      </h3>
      <p className="mt-2 text-muted-foreground">
        Pick a beginner-friendly pattern, enter your quilt size, and let QuiltButler calculate the
        exact pieces, yardage, and cutting diagrams for your first project.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Plan your first quilt
      </Link>
    </div>
  </div>
);

const post: BlogPost = {
  slug: "10-quilting-tips-for-beginners",
  title,
  description:
    "Ten practical quilting habits every beginner should learn before starting their first project, from scant ¼\" seams to chain piecing and squaring up blocks.",
  publishedAt: "2026-08-01",
  tags: ["beginner quilting", "quilting tips", "how to quilt", "quilting seams", "quilting tools"],
  excerpt:
    "Quilting has a learning curve, but most mistakes are avoidable once you know what to watch for. Learn ten habits experienced quilters wish someone had told them on day one.",
  readingTimeMinutes: 6,
  renderContent,
};

export default post;
