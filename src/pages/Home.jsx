import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRightLeft,
    PlusCircle,
    MessageCircle,
    Search,
    HeartHandshake,
    ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
    const { t } = useTranslation();
    const [slide, setSlide] = useState(0);

    const slides = [
        {
            title: t("slider.oneTitle"),
            text: t("slider.oneText"),
            icon: <PlusCircle />,
        },
        {
            title: t("slider.twoTitle"),
            text: t("slider.twoText"),
            icon: <ArrowRightLeft />,
        },
        {
            title: t("slider.threeTitle"),
            text: t("slider.threeText"),
            icon: <MessageCircle />,
        },
    ];

    const features = [
        [<PlusCircle />, t("features.post")],
        [<ArrowRightLeft />, t("features.swipe")],
        [<Search />, t("features.filters")],
        [<HeartHandshake />, t("features.matches")],
        [<MessageCircle />, t("features.chat")],
        [<ShieldCheck />, t("features.safe")],
    ];

    return (
        <main>
            <section className="hero">
                <motion.div
                    className="heroText"
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="badge">{t("hero.badge")}</div>

                    <h1>{t("hero.title")}</h1>
                    <p>{t("hero.text")}</p>

                    <div className="heroActions">
                        <Link to="/about" className="primaryBtn">
                            {t("hero.cta")}
                        </Link>
                        <Link to="/support" className="secondaryBtn">
                            {t("hero.support")}
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    className="phoneMockup"
                    initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="phoneTop">
                        <span>SawaSwap</span>
                        <small>Live Feed</small>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={slide}
                            className="slideCard"
                            initial={{ opacity: 0, x: 45 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -45 }}
                            transition={{ duration: 0.35 }}
                        >
                            <div className="slideIcon">{slides[slide].icon}</div>
                            <h3>{slides[slide].title}</h3>
                            <p>{slides[slide].text}</p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="dots">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                className={slide === index ? "dot active" : "dot"}
                                onClick={() => setSlide(index)}
                            />
                        ))}
                    </div>
                </motion.div>
            </section>

            <section className="featuresSection">
                <motion.div
                    className="sectionHeader"
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2>{t("features.title")}</h2>
                </motion.div>

                <div className="featuresGrid">
                    {features.map(([icon, text], index) => (
                        <motion.div
                            key={index}
                            className="featureCard"
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06 }}
                            viewport={{ once: true }}
                        >
                            <div className="featureIcon">{icon}</div>
                            <p>{text}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </main>
    );
}