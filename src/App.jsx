import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import DistrictsPage from "./pages/DistrictsPage";
import DistrictDetailPage from "./pages/DistrictDetailPage";
import MapPage from "./pages/MapPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import PlansPage from "./pages/PlansPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FramesPage from "./pages/FramesPage";
import MembershipPage from "./pages/MembershipPage";
import PartnersPage from "./pages/PartnersPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout({ children, noFooter }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!noFooter && <Footer />}
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
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        <Route path="/frames" element={<Layout><FramesPage /></Layout>} />
        <Route path="/membership" element={<Layout><MembershipPage /></Layout>} />
        <Route path="/partners" element={<Layout><PartnersPage /></Layout>} />
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        <Route path="*" element={<Layout><div className="max-w-7xl mx-auto px-4 py-16 text-center"><h1 className="text-4xl font-bold text-base-content mb-4">404</h1><p className="text-base-content/50 mb-6">Page not found</p><a href="/" className="btn btn-primary">Go Home</a></div></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
