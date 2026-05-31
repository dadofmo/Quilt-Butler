import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <Helmet>
        <title>Privacy Policy — QuiltButler</title>
        <meta
          name="description"
          content="QuiltButler Privacy Policy: what we collect, how we use it, who we share with, cookies, and your rights."
        />
        <link rel="canonical" href="https://quiltbutler.com/privacy" />
      </Helmet>

      <article className="mx-auto max-w-2xl text-foreground">
        <p className="mb-2 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground hover:underline">
            ← Back to QuiltButler
          </Link>
        </p>

        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: May 29, 2026</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">What we collect</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Email address</strong> — collected by our payment processor, Freemius, when
              you buy a license. Used to send you your license key and receipts.
            </li>
            <li>
              <strong>Analytics</strong> — we use Google Analytics to understand which patterns
              and features are popular. This includes anonymized data like browser type, country,
              and pages visited. It does <strong>not</strong> include your name or email.
            </li>
            <li>
              <strong>License activations</strong> — when you activate your license key on a device,
              Freemius records that activation so we can enforce the 3-device limit.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Occasional emails from QuiltButler</h2>
          <p>
            When you purchase a license, you consent to receive <strong>occasional emails</strong>{" "}
            from QuiltButler about:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Important product updates (new patterns, major features)</li>
            <li>Bug fixes or service issues that affect your license</li>
            <li>Account or licensing matters (renewals, device changes)</li>
          </ul>
          <p>
            We will <strong>not</strong> send marketing emails for third-party products, and we
            will not share your email with anyone for promotional purposes. Every non-essential
            email will include an unsubscribe link. Account and licensing emails are required for
            your purchase to function and cannot be unsubscribed from.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">What we don't collect</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>We don't ask you to create an account</li>
            <li>
              We don't store your quilt designs on our servers — everything you plan stays in your
              browser
            </li>
            <li>We don't sell, rent, or share your personal data with advertisers</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Who we share data with</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Freemius</strong> (payments &amp; licensing) —{" "}
              <a
                href="https://freemius.com/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                freemius.com/privacy
              </a>
            </li>
            <li>
              <strong>Google Analytics</strong> (anonymized site analytics) —{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                policies.google.com/privacy
              </a>
            </li>
          </ul>
          <p>That's the complete list.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Cookies</h2>
          <p>
            We use a small number of cookies for analytics and to remember your license activation
            on this device. You'll see a one-time banner on your first visit. Dismissing it just
            hides the banner — it doesn't change what's collected.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Your rights</h2>
          <p>
            You can email{" "}
            <a href="mailto:quiltbutler@gmail.com" className="underline">
              quiltbutler@gmail.com
            </a>{" "}
            anytime to:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Request a copy of any personal data we hold (just your email and purchase record)
            </li>
            <li>Request deletion of your account and license</li>
            <li>Ask any privacy-related question</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Changes</h2>
          <p>We'll update the "Last updated" date above if this policy changes.</p>
        </section>
      </article>
    </main>
  );
}
