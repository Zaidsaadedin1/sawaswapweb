import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function Terms() {
    const { t } = useTranslation();
    const sections = t("terms.sections", { returnObjects: true });

    return (
        <main className="page termsPage">
            <motion.section
                className="pageCard wideCard"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <span className="badge">{t("terms.badge")}</span>

                <div className="termsHeader">
                    <div>
                        <h1>{t("terms.title")}</h1>
                        <p>{t("terms.intro")}</p>
                        <small>{t("terms.updated")}</small>
                    </div>

                    <div className="termsIcon">
                        <FileText />
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