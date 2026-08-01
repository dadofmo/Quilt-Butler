import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { posts } from "@/content/blog";
import { format } from "date-fns";

export default function BlogIndexPage() {
  const title = "The Butler Blog — Quilting Tips, Pattern Guides & How-To";
  const description =
    "Quilting tips, pattern guides, and how-to articles from QuiltButler. Learn beginner-friendly techniques, fabric advice, and time-saving habits before your first quilt.";
  const canonical = "https://quiltbutler.com/blog";

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "The Butler Blog",
    url: canonical,
    description,
    author: {
      "@type": "Organization",
      name: "QuiltButler",
      url: "https://quiltbutler.com/",
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `https://quiltbutler.com/blog/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      description: post.description,
    })),
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(blogJsonLd)}</script>
      </Helmet>

      <article className="mx-auto max-w-3xl">
        <p className="mb-2 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground hover:underline">
            ← Back to QuiltButler
          </Link>
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          The Butler Blog
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Quilting tips, pattern guides, and how-to articles — written for quilters of every skill
          level.
        </p>

        <div className="mt-10 grid gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <Link to={`/blog/${post.slug}`} className="block focus:outline-none">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <time dateTime={post.publishedAt}>
                    {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                  </time>
                  <span aria-hidden>·</span>
                  <span>{post.readingTimeMinutes} min read</span>
                </div>

                <h2 className="mt-2 text-xl font-semibold text-card-foreground group-hover:text-primary sm:text-2xl">
                  {post.title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>

                <span className="mt-4 inline-block text-sm font-medium text-primary group-hover:underline">
                  Read article →
                </span>
              </Link>
            </article>
          ))}
        </div>
      </article>
    </main>
  );
}
