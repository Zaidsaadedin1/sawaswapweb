import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, MoonStar, SunMedium } from "lucide-react";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2m0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95zm8.95 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2M12 6.85A5.15 5.15 0 1 1 6.85 12 5.16 5.16 0 0 1 12 6.85m0 1.8A3.35 3.35 0 1 0 15.35 12 3.35 3.35 0 0 0 12 8.65"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.64 22v-8.2h2.75l.41-3.2h-3.16V8.56c0-.93.26-1.56 1.59-1.56H16.6V4.13a18.2 18.2 0 0 0-2-.1c-2 0-3.36 1.2-3.36 3.43v3.14H9v3.2h2.24V22z"
      />
    </svg>
  );
}

export default function TopBar() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [messageIndex, setMessageIndex] = useState(0);

  const topBarMessages = [
    t("topBar.messages.one"),
    t("topBar.messages.two"),
    t("topBar.messages.three"),
  ];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % topBarMessages.length);
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, [topBarMessages.length]);

  function toggleLanguage() {
    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
  }

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return (
    <div className="topBar">
      <div className="topBarSocials" aria-label={t("topBar.socialLabel")}>
        <a
          href="https://www.instagram.com/sawaswap/"
          target="_blank"
          rel="noreferrer"
          className="topBarIconLink"
          aria-label="Instagram"
        >
          <InstagramIcon />
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=61589612847799"
          target="_blank"
          rel="noreferrer"
          className="topBarIconLink"
          aria-label="Facebook"
        >
          <FacebookIcon />
        </a>
      </div>

      <div className="topBarTicker" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={`${i18n.language}-${messageIndex}`}
            className="topBarMessage"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.24 }}
          >
            {topBarMessages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="topBarActions">
        <button
          type="button"
          className="iconControlBtn"
          onClick={toggleTheme}
          aria-label={t("topBar.themeLabel")}
        >
          {theme === "light" ? <MoonStar size={16} /> : <SunMedium size={16} />}
        </button>
        <button
          type="button"
          className="iconControlBtn langIconBtn"
          onClick={toggleLanguage}
          aria-label={t("topBar.languageLabel")}
        >
          <Globe2 size={16} />
          <span>{i18n.language === "en" ? "AR" : "EN"}</span>
        </button>
      </div>
    </div>
  );
}
