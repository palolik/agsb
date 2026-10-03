import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
// Home stays in the main chunk (it's the usual landing page / LCP);
// every other route is split into its own chunk.
import HomePage from "./pages/HomePage";
import RequireAuth from "./components/RequireAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import PageMeta from "./components/PageMeta";
import { Spinner } from "./components/StateViews";

// After a deploy, an open tab may ask for a chunk that no longer exists.
// Reload once to pick up the new build; if that still fails, let the
// ErrorBoundary show its message instead of looping.
const RELOAD_FLAG = "agsb_chunk_reload";
function reloadFlag(value) {
  try {
    if (value === undefined) return sessionStorage.getItem(RELOAD_FLAG);
    if (value === null) sessionStorage.removeItem(RELOAD_FLAG);
    else sessionStorage.setItem(RELOAD_FLAG, value);
  } catch {
    return "1"; // storage unavailable: never auto-reload
  }
  return null;
}
function page(load) {
  return lazy(() =>
    load()
      .then((mod) => {
        reloadFlag(null);
        return mod;
      })
      .catch((err) => {
        if (!reloadFlag()) {
          reloadFlag("1");
          window.location.reload();
          return new Promise(() => {});
        }
        throw err;
      })
  );
}

const DistrictsPage = page(() => import("./pages/DistrictsPage"));
const DistrictDetailPage = page(() => import("./pages/DistrictDetailPage"));
const MapPage = page(() => import("./pages/MapPage"));
const BlogPage = page(() => import("./pages/BlogPage"));
const BlogDetailPage = page(() => import("./pages/BlogDetailPage"));
const PlansPage = page(() => import("./pages/PlansPage"));
const PlanDetailPage = page(() => import("./pages/PlanDetailPage"));
const AboutPage = page(() => import("./pages/AboutPage"));
const ContactPage = page(() => import("./pages/ContactPage"));
const FramesPage = page(() => import("./pages/FramesPage"));
const MembershipPage = page(() => import("./pages/MembershipPage"));
const PartnersPage = page(() => import("./pages/PartnersPage"));
const LoginPage = page(() => import("./pages/LoginPage"));
const SignupPage = page(() => import("./pages/SignupPage"));
const ProfilePage = page(() => import("./pages/ProfilePage"));
const BookingPage = page(() => import("./pages/BookingPage"));
const CheckoutPage = page(() => import("./pages/CheckoutPage"));
const PaymentPage = page(() => import("./pages/PaymentPage"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout({ children, noFooter }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<Spinner />}>{children}</Suspense>
        </ErrorBoundary>
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <PageMeta title="পাতা পাওয়া যায়নি · Page not found" description="The page you were looking for doesn't exist." />
      <meta name="robots" content="noindex" />
      <h1 className="text-4xl font-bold text-base-content mb-4">404</h1>
      <p className="text-base-content/50 mb-6">Page not found</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/districts" element={<Layout><DistrictsPage /></Layout>} />
        <Route path="/districts/:slug" element={<Layout><DistrictDetailPage /></Layout>} />
        <Route path="/map" element={<Layout noFooter><MapPage /></Layout>} />
        <Route path="/blog" element={<Layout><BlogPage /></Layout>} />
        <Route path="/blog/:slug" element={<Layout><BlogDetailPage /></Layout>} />
        <Route path="/plans" element={<Layout><PlansPage /></Layout>} />
        <Route path="/plans/:slug" element={<Layout><PlanDetailPage /></Layout>} />
        <Route path="/plans/:slug/book" element={<Layout><RequireAuth><BookingPage /></RequireAuth></Layout>} />
        <Route path="/bookings/:id/checkout" element={<Layout><RequireAuth><CheckoutPage /></RequireAuth></Layout>} />
        <Route path="/bookings/:id/pay" element={<Layout><RequireAuth><PaymentPage /></RequireAuth></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        <Route path="/frames" element={<Layout><FramesPage /></Layout>} />
        <Route path="/membership" element={<Layout><MembershipPage /></Layout>} />
        <Route path="/partners" element={<Layout><PartnersPage /></Layout>} />
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
