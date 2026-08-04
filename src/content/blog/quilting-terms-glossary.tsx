import { Link } from "react-router-dom";
import type { BlogPost } from "./types";

const title = "Quilting Terms Every Beginner Should Know (HST, WOF, RST & More)";

function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-foreground">{term}</h3>
      <p>{children}</p>
    </div>
  );
}

const renderContent = () => (
  <div className="space-y-8">
    <p className="text-lg leading-relaxed text-foreground">
      Quilting has its own language, and nobody hands you the dictionary on day one. Scroll through
      any quilting pattern, forum, or Instagram caption and you'll run into a wall of acronyms and
      shorthand that seem designed to keep beginners out. They're not — quilters just talk fast.
      Here's the plain-English guide so you're never stuck guessing what a pattern means.
    </p>

    <section className="space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Common Abbreviations You'll See Everywhere
      </h2>

      <Term term="RST — Right Sides Together">
        The single most common instruction in any pattern. It means laying two pieces of fabric with
        their printed/pretty sides facing each other, so the plain backs face out on both the top and
        bottom. You sew along the matched edge, then unfold so both pieces lie flat, printed sides up.
      </Term>

      <Term term="WOF — Width of Fabric">
        The distance across a bolt of fabric from selvage to selvage — usually 42" to 44" on standard
        quilting cotton. When a pattern says "cut a 2.5" × WOF strip," it means cut a strip the full
        width of the fabric, 2.5" tall.
      </Term>

      <Term term="HST — Half-Square Triangle">
        A square made from two triangles of different fabric, sewn together along the diagonal. One of
        the most common building blocks in quilting — you'll see it constantly.
      </Term>

      <Term term="QST — Quarter-Square Triangle">
        Similar to an HST, but made from four triangles instead of two, meeting at a center point.
        Used when a block needs triangles pointing in more than one direction within a single square.
      </Term>

      <Term term="FQ — Fat Quarter">
        A precut piece of fabric roughly 18" × 21" — cut differently than a standard quarter-yard so
        it's more usable for cutting larger squares. Sold individually or in bundles.
      </Term>

      <Term term="WIP — Work in Progress">
        Any project you've started but haven't finished. Most quilters have more than one at any given
        time — it's practically a badge of honor in the community, not something to feel behind on.
      </Term>

      <Term term="UFO — Unfinished Object">
        A step beyond WIP — a project that's been set aside long enough that it's earned its own
        acronym. No judgment; every quilter has a few.
      </Term>

      <Term term="QAL — Quilt-Along">
        A group sewing event, often run by a shop or designer, where everyone works on the same
        pattern together over a set number of weeks, usually sharing progress online.
      </Term>
    </section>

    <section className="space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Fabric &amp; Cutting Terms
      </h2>

      <Term term="Selvage">
        The tightly-woven, factory-finished edge that runs along both long sides of a fabric bolt —
        often printed with the manufacturer's name or color dots. It behaves differently than the rest
        of the fabric and should always be trimmed away before cutting your pieces.
      </Term>

      <Term term="Grain">
        The direction fabric threads run. Straight grain runs parallel to the selvage (the strongest,
        most stable direction). Bias runs at a 45° angle to the grain and stretches much more easily —
        helpful for binding curves, but risky if you accidentally cut a straight edge on the bias,
        since it'll distort as you sew.
      </Term>

      <Term term="Yardage">
        The amount of fabric you need, measured in yards. A pattern's yardage requirements assume
        standard WOF (width of fabric) — this is exactly the number{" "}
        <Link to="/" className="text-primary hover:underline">
          QuiltButler's calculator
        </Link>{" "}
        works out for you automatically once you've picked a block, size, and layout.
      </Term>

      <Term term="Jelly Roll">
        A bundle of precut fabric strips, each 2.5" wide and running the full width of the fabric,
        rolled up together — usually 20–40 different prints from one fabric collection.
      </Term>

      <Term term="Layer Cake">
        A bundle of precut 10" × 10" squares, similarly rolled or stacked from one fabric collection.
      </Term>

      <Term term="Charm Pack">
        A bundle of precut 5" × 5" squares — the smallest of the common precut bundle types.
      </Term>
    </section>

    <section className="space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Piecing &amp; Construction Terms
      </h2>

      <Term term="Seam Allowance">
        The narrow strip of fabric between your stitching line and the raw edge — standard in quilting
        is ¼". This is why a "5-inch finished square" is actually cut at 5.5" — the extra half-inch
        accounts for seam allowance on all sides.
      </Term>

      <Term term={'Scant ¼"'}>
        A seam just barely narrower than a true ¼" — often just one or two thread-widths less. It
        compensates for the tiny bit of fabric that gets folded into the seam itself, keeping your
        finished blocks the correct size.
      </Term>

      <Term term="Pressing (as opposed to ironing)">
        Setting an iron straight down on a seam, holding it briefly, then lifting straight back up —
        no sliding. Sliding the iron back and forth (true "ironing") can stretch and distort seams,
        especially on bias edges.
      </Term>

      <Term term="Piecing">
        The process of sewing smaller fabric pieces together to build a quilt block or top — as
        opposed to appliqué, where shapes are stitched on top of a background fabric instead of pieced
        into it.
      </Term>

      <Term term="Squaring Up">
        Trimming a block to its exact intended size using a ruler, after it's been pieced — corrects
        any small inconsistencies before you sew blocks together.
      </Term>

      <Term term="Sashing">
        The strips of fabric sewn between blocks to separate and frame them — entirely optional, and
        one of the settings you can toggle directly in QuiltButler when planning a quilt layout.
      </Term>

      <Term term="Border">
        The frame of fabric that runs around the entire outer edge of a finished quilt top, after all
        the blocks are sewn together.
      </Term>
    </section>

    <section className="space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">Finishing Terms</h2>

      <Term term="Batting">
        The soft, fluffy middle layer of a quilt, sandwiched between the top (your pieced design) and
        the backing — this is what gives a quilt its warmth and loft.
      </Term>

      <Term term="Backing">The fabric on the back of the quilt — what you see when you flip it over.</Term>

      <Term term="Quilt Sandwich">
        The three layers — top, batting, backing — once they're layered together and ready to be
        quilted (stitched through all three layers).
      </Term>

      <Term term="Basting">
        Temporarily securing the three layers of a quilt sandwich together (with pins, spray adhesive,
        or thread) so they don't shift while you're quilting.
      </Term>

      <Term term="Binding">
        The narrow strip of fabric that wraps around and finishes the raw outer edges of a finished
        quilt, sewn on last.
      </Term>
    </section>

    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-xl font-semibold text-card-foreground">Ready to use the lingo?</h3>
      <p className="mt-2 text-muted-foreground">
        Bookmark this page — you'll likely find yourself back here more than once in your first few
        projects. And if you're ready to put these terms into practice, QuiltButler's pattern library
        walks you through sizing, fabric assignment, and cutting diagrams for over 30
        beginner-friendly blocks.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Browse the pattern library
      </Link>
    </div>
  </div>
);

const post: BlogPost = {
  slug: "quilting-terms-glossary-for-beginners",
  title,
  description:
    "A plain-English glossary of quilting terms and abbreviations for beginners — HST, QST, WOF, RST, fat quarters, sashing, basting, binding and more, explained simply.",
  publishedAt: "2026-08-04",
  tags: [
    "quilting terms",
    "quilting glossary",
    "quilting abbreviations",
    "HST",
    "WOF",
    "beginner quilting",
  ],
  excerpt:
    "HST, WOF, RST, QST, FQ, UFO — quilting patterns are full of shorthand nobody explains. Here's a plain-English glossary of the terms every beginner runs into.",
  readingTimeMinutes: 7,
  renderContent,
};

export default post;
