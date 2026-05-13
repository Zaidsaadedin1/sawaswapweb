import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, MapPin } from "lucide-react";

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="footer">
            <div>
                <h3>
                    <span>Sawa</span>Swap
                </h3>
                <p>{t("footer.text")}</p>
            </div>

            <div className="footerLinks">
                <Link to="/about">{t("nav.about")}</Link>
                <Link to="/support">{t("nav.support")}</Link>
                <Link to="/terms">{t("nav.terms")}</Link>
                <Link to="/privacy">{t("nav.privacy")}</Link>
            </div>

            <div className="footerInfo">
                <p>
                    <Mail size={16} />
                    {t("support.email")}
                </p>
                <p>
                    <MapPin size={16} />
                    {t("support.location")}
                </p>
            </div>
        </footer>
    );
}
