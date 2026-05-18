import { Routes, Route, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Verified from "./pages/Verified";
import DeleteAccount from "./pages/DeleteAccount";
import HowItWorks from "./pages/HowItWorks";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

export default function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isArabic = i18n.language === "ar";
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="app">
      {!isAdminRoute ? <Navbar /> : null}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/support" element={<Support />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/auth/verified" element={<Verified />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAdminRoute ? <Footer /> : null}
    </div>
  );
}
