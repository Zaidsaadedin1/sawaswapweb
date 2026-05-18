import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowRightLeft, Compass, LifeBuoy, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("notFound.pageTitle")} | SawaSwap`;
  }, [t]);

  const links = [
    { to: "/", label: t("notFound.home"), icon: <ArrowRightLeft size={18} /> },
    { to: "/how-it-works", label: t("notFound.howItWorks"), icon: <Compass size={18} /> },
    { to: "/support", label: t("notFound.support"), icon: <LifeBuoy size={18} /> },
  ];

  return (
    <main className="notFoundPage">
      <section className="notFoundSection">
        <motion.div
          className="notFoundCard"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55 }}
        >
          <motion.div
            className="notFoundIconWrap"
            initial={{ rotate: -14, scale: 0.75, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 180 }}
          >
            <ArrowRightLeft className="notFoundIcon" />
          </motion.div>

          <div className="badge notFoundBadge">{t("notFound.badge")}</div>
          <p className="notFoundCode">404</p>
          <h1>{t("notFound.title")}</h1>
          <p className="notFoundLead">{t("notFound.text")}</p>

          <div className="notFoundHint">
            <Search size={18} />
            <span>{t("notFound.hint")}</span>
          </div>

          <div className="notFoundActions">
            <Link to="/" className="primaryBtn">
              {t("notFound.cta")}
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="notFoundLinks">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="notFoundLinkCard">
                <div className="notFoundLinkIcon">{link.icon}</div>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
