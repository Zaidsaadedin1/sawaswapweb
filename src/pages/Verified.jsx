import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Verified() {
    const { t } = useTranslation();

    return (
        <main>
            <section className="verifiedSection">
                <motion.div
                    className="verifiedCard"
                    initial={{ opacity: 0, y: 35, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.65 }}
                >
                    <motion.div
                        className="verifiedIconWrap"
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
                    >
                        <CheckCircle2 className="verifiedIcon" />
                    </motion.div>

                    <div className="badge verifiedBadge">
                        <ShieldCheck size={16} />
                        {t("verified.badge")}
                    </div>

                    <h1>{t("verified.title")}</h1>

                    <p>{t("verified.text")}</p>

                    <div className="verifiedActions">
                        <Link to="/" className="primaryBtn">
                            {t("verified.home")}
                            <ArrowRight size={18} />
                        </Link>

                        <Link to="/support" className="secondaryBtn">
                            {t("verified.support")}
                        </Link>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}