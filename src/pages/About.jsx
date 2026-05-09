import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
    ArrowRightLeft,
    HeartHandshake,
    MessageCircle,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

export default function About() {
    const { t } = useTranslation();

    const items = t("about.whatItems", { returnObjects: true });

    return (
        <main className="page aboutPage">
            <motion.section
                className="pageCard wideCard"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <span className="badge">{t("about.badge")}</span>

                <h1>{t("about.title")}</h1>

                <p>{t("about.intro")}</p>

                <div className="aboutGrid">
                    <div className="aboutBlock greenBlock">
                        <Sparkles />
                        <h2>{t("about.missionTitle")}</h2>
                        <p>{t("about.mission")}</p>
                    </div>

                    <div className="aboutBlock navyBlock">
                        <HeartHandshake />
                        <h2>{t("about.communityTitle")}</h2>
                        <p>{t("about.community")}</p>
                    </div>
                </div>

                <section className="contentSection">
                    <h2>{t("about.whatTitle")}</h2>

                    <div className="aboutList">
                        {items.map((item, index) => (
                            <motion.div
                                key={item}
                                className="aboutListItem"
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.04 }}
                            >
                                <div className="checkIcon">
                                    {index % 4 === 0 ? (
                                        <ArrowRightLeft />
                                    ) : index % 4 === 1 ? (
                                        <MessageCircle />
                                    ) : index % 4 === 2 ? (
                                        <HeartHandshake />
                                    ) : (
                                        <ShieldCheck />
                                    )}
                                </div>

                                <p>{item}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="contentSection safetyBox">
                    <ShieldCheck />
                    <div>
                        <h2>{t("about.safetyTitle")}</h2>
                        <p>{t("about.safety")}</p>
                    </div>
                </section>
            </motion.section>
        </main>
    );
}