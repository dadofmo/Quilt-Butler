import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { posts, getPostBySlug } from "@/content/blog";

function NotFound() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <Helmet>
        <title>Page not found — QuiltButler</title>
        <meta
          name="description"
          content="The page you're looking for doesn't exist. Head back to QuiltButler to plan your next quilt."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <article className="mx-auto max-w-2xl text-foreground">
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The blog post you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex gap-4">
          <Link
            to="/blog"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to the blog
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
          >
            Go home
          </Link>
        </div>
      </article>
    </main>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return <NotFound />;
  }

  const url = `https://quiltbutler.com/blog/${post.slug}`;
  const dateModified = post.updatedAt ?? post.publishedAt;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    url,
    datePublished: post.publishedAt,
    dateModified,
    author: {
      "@type": "Organization",
      name: "QuiltButler",
      url: "https://quiltbutler.com/",
    },
    publisher: {
      "@type": "Organization",
      name: "QuiltButler",
      url: "https://quiltbutler.com/",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    tags: post.tags,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "QuiltButler",
        item: "https://quiltbutler.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "The Butler Blog",
        item: "https://quiltbutler.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: url,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <Helmet>
        <title>{post.title}</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:modified_time" content={dateModified} />
        {post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground hover:underline">
                QuiltButler
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to="/blog" className="hover:text-foreground hover:underline">
                The Butler Blog
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        <header className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={post.publishedAt}>
              Published {format(new Date(post.publishedAt), "MMMM d, yyyy")}
            </time>
            <span aria-hidden>·</span>
            <span>{post.readingTimeMinutes} min read</span>
          </div>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-sm mt-8 max-w-none text-foreground sm:prose-base">
          {post.renderContent()}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <Link to="/blog" className="text-sm font-medium text-primary hover:underline">
            ← All articles
          </Link>
        </div>
      </article>
    </main>
  );
}
