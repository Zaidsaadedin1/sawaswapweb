import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function Privacy() {
    const { t } = useTranslation();
    const sections = t("privacy.sections", { returnObjects: true });

    return (
        <main className="page termsPage">
            <motion.section
                className="pageCard wideCard"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <span className="badge">{t("privacy.badge")}</span>

                <div className="termsHeader">
                    <div>
                        <h1>{t("privacy.title")}</h1>
                        <p>{t("privacy.intro")}</p>
                        <small>{t("privacy.updated")}</small>
                    </div>

                    <div className="termsIcon">
                        <ShieldCheck />
                    </div>
                </div>

                <div className="termsList">
                    {sections.map((section, index) => (
                        <motion.article
                            key={section.title}
                            className="termsItem"
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <h2>{section.title}</h2>
                            <p>{section.body}</p>
                        </motion.article>
                    ))}
                </div>
            </motion.section>
        </main>
    );
}
