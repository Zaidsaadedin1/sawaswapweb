import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe2, Menu, X, ArrowRightLeft } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);

    function toggleLanguage() {
        i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
        setOpen(false);
    }

    return (
        <header className="navbar">
            <Link to="/" className="brand">
                <div className="brandIcon">
                    <ArrowRightLeft size={22} />
                </div>
                <span>
                    <strong>Sawa</strong>Swap
                </span>
            </Link>

            <nav className={open ? "navLinks open" : "navLinks"}>
                <NavLink to="/" onClick={() => setOpen(false)}>
                    {t("nav.home")}
                </NavLink>

                <NavLink to="/how-it-works" onClick={() => setOpen(false)}>
                    {t("nav.howItWorks")}
                </NavLink>

                <NavLink to="/about" onClick={() => setOpen(false)}>
                    {t("nav.about")}
                </NavLink>

                <NavLink to="/support" onClick={() => setOpen(false)}>
                    {t("nav.support")}
                </NavLink>

                <NavLink to="/terms" onClick={() => setOpen(false)}>
                    {t("nav.terms")}
                </NavLink>

                <NavLink to="/privacy" onClick={() => setOpen(false)}>
                    {t("nav.privacy")}
                </NavLink>

                <button className="langBtn" onClick={toggleLanguage}>
                    <Globe2 size={18} />
                    {i18n.language === "en" ? "العربية" : "English"}
                </button>
            </nav>

            <button className="menuBtn" onClick={() => setOpen(!open)}>
                {open ? <X /> : <Menu />}
            </button>
        </header>
    );
}
