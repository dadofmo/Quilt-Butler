import { Routes, Route, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PatternPickerPage from "./pages/PatternPickerPage";
import SizePage from "./pages/SizePage";
import FabricsPage from "./pages/FabricsPage";
import ResultsPage from "./pages/ResultsPage";
import { ScrollToTop } from "./components/ScrollToTop";

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

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<PatternPickerPage />} />
      <Route path="/size" element={<SizePage />} />
      <Route path="/fabrics" element={<FabricsPage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}
