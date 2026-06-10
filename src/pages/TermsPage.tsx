import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <Helmet>
        <title>Terms of Service — QuiltButler</title>
        <meta
          name="description"
          content="QuiltButler Terms of Service: license terms, no-warranty, limit of liability, acceptable use, and contact."
        />
        <link rel="canonical" href="https://quiltbutler.com/terms" />
      </Helmet>

      <article className="mx-auto max-w-2xl text-foreground">
        <p className="mb-2 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground hover:underline">
            ← Back to QuiltButler
          </Link>
        </p>

        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: June 10, 2026</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">1. Who we are</h2>
          <p>
            QuiltButler is an online quilt planning tool operated as a personal project. You can
            reach us anytime at{" "}
            <a href="mailto:quiltbutler@gmail.com" className="underline">
              quiltbutler@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">2. What you're buying</h2>
          <p>
            A QuiltButler license is a <strong>one-time purchase for personal use</strong>. Your
            license key activates the planner on up to <strong>3 devices</strong>. Licenses are
            tied to the email used at purchase and are not transferable, resellable, or for
            commercial redistribution.
          </p>
          <p>
            By purchasing a license, you consent to receive occasional emails from QuiltButler
            related to your license, product updates, and important announcements. See our{" "}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">3. No warranty — please double-check your cuts</h2>
          <p>
            QuiltButler is provided <strong>"as is."</strong> Yardage estimates, cutting diagrams,
            shopping lists, and cost estimates are <strong>planning guidance, not guarantees</strong>.
            Fabric widths, shrinkage, pattern repeats, and your own cutting choices all affect
            real-world results. <strong>Always measure twice and cut once.</strong> We are not
            responsible for fabric purchased, cut, or wasted based on QuiltButler's output.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">4. Limit of liability</h2>
          <p>
            To the maximum extent allowed by law, our total liability to you for any claim related
            to QuiltButler is limited to <strong>the amount you paid for your license</strong>{" "}
            (currently $7.99).
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">5. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Resell, sublicense, or redistribute QuiltButler or your license key</li>
            <li>Reverse-engineer, decompile, or attempt to bypass the license system</li>
            <li>Use QuiltButler to harm others or violate any law</li>
          </ul>
          <p>We may deactivate licenses found to be shared or used in violation of these terms.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">6. Service availability</h2>
          <p>
            QuiltButler is a small project and may occasionally be unavailable for maintenance or
            updates. If the primary domain (quiltbutler.com) ever goes away, the planner will
            remain accessible at <strong>quiltbutler.lovable.app</strong> as a permanent backup.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">7. Changes to these terms</h2>
          <p>
            We may update these terms occasionally. The "Last updated" date above will reflect any
            changes. Continued use of QuiltButler after an update means you accept the new terms.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">8. Contact</h2>
          <p>
            Questions? Email{" "}
            <a href="mailto:quiltbutler@gmail.com" className="underline">
              quiltbutler@gmail.com
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
