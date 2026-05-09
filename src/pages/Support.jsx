import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Mail, MapPin, Send } from "lucide-react";

export default function Support() {
    const { t } = useTranslation();

    return (
        <main className="page">
            <motion.section
                className="pageCard"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <span className="badge">Support</span>
                <h1>{t("support.title")}</h1>
                <p>{t("support.text")}</p>

                <div className="supportList">
                    <a href={`mailto:${t("support.email")}`}>
                        <Mail />
                        <span>{t("support.email")}</span>
                    </a>

                    <div>
                        <Send />
                        <span>{t("support.noreply")}</span>
                    </div>

                    <div>
                        <MapPin />
                        <span>{t("support.location")}</span>
                    </div>
                </div>
            </motion.section>
        </main>
    );
}