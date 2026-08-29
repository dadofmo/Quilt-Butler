import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PatternPickerPage from "./pages/PatternPickerPage";
const SizePage = lazy(() => import("./pages/SizePage"));
const FabricsPage = lazy(() => import("./pages/FabricsPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const BlogIndexPage = lazy(() => import("./pages/BlogIndexPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
import { ScrollToTop } from "./components/ScrollToTop";
import { TestModeBanner } from "./components/TestModeBanner";
import { SiteFooter } from "./components/SiteFooter";
import { CookieBanner } from "./components/CookieBanner";




function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Helmet>
        <title>Page not found — QuiltButler</title>
        <meta name="description" content="The page you're looking for doesn't exist. Head back to QuiltButler to plan your next quilt." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function HelmetCleanup() {
  useEffect(() => {
    // React 19 + react-helmet-async 3 doesn't remove pre-rendered static tags
    // from index.html, so they duplicate Helmet-managed tags after hydration.
    // Remove the static tags marked with data-rh so each route owns exactly
    // one set of title/description/Open Graph tags.
    document.querySelectorAll('head [data-rh="true"]').forEach((tag) => tag.remove());
  }, []);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <TestModeBanner />
      <HelmetCleanup />
      <ScrollToTop />
      <div className="flex flex-1 flex-col">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<PatternPickerPage />} />
            <Route path="/design" element={<DesignBlockPage />} />
            <Route path="/size" element={<SizePage />} />
            <Route path="/fabrics" element={<FabricsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      <SiteFooter />
      <CookieBanner />
    </div>
  );
}

