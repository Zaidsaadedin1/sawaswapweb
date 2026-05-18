import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import TopBar from "./TopBar";

export default function Navbar() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <div className="siteHeader">
            <TopBar />

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

                    <NavLink to="/items" onClick={() => setOpen(false)}>
                        {t("nav.items")}
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
                </nav>

                <button type="button" className="menuBtn" onClick={() => setOpen(!open)} aria-label={open ? t("topBar.closeMenu") : t("topBar.openMenu")}>
                    {open ? <X /> : <Menu />}
                </button>
            </header>
        </div>
    );
}
