import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
    BadgeCheck,
    Camera,
    Compass,
    MessageSquareMore,
    ArrowRightLeft,
} from "lucide-react";

const icons = [BadgeCheck, Camera, Compass, MessageSquareMore];

export default function HowItWorks() {
    const { t } = useTranslation();
    const steps = t("howItWorks.steps", { returnObjects: true });

    return (
        <main className="page howItWorksPage">
            <motion.section
                className="pageCard wideCard"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <span className="badge">{t("howItWorks.badge")}</span>

                <div className="howItWorksHeader">
                    <div>
                        <h1>{t("howItWorks.title")}</h1>
                        <p>{t("howItWorks.intro")}</p>
                    </div>

                    <div className="howItWorksHeroIcon">
                        <ArrowRightLeft />
                    </div>
                </div>

                <div className="howStepsGrid">
                    {steps.map((step, index) => {
                        const Icon = icons[index] || ArrowRightLeft;

                        return (
                            <motion.article
                                key={step.title}
                                className="howStepCard"
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.04 }}
                            >
                                <div className="howStepTop">
                                    <div className="howStepIcon">
                                        <Icon />
                                    </div>
                                    <span className="howStepNumber">
                                        {t("howItWorks.stepLabel", {
                                            number: index + 1,
                                        })}
                                    </span>
                                </div>

                                <h2>{step.title}</h2>
                                <p>{step.body}</p>
                            </motion.article>
                        );
                    })}
                </div>

                <section className="howSummaryBox">
                    <h2>{t("howItWorks.summaryTitle")}</h2>
                    <p>{t("howItWorks.summary")}</p>
                </section>
            </motion.section>
        </main>
    );
}
