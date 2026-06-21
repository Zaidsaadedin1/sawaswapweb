import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Download, ExternalLink, Smartphone } from "lucide-react";
import {
  ANDROID_APP_URL,
  IOS_APP_URL,
  detectDevicePlatform,
  getStoreUrlForPlatform,
} from "../lib/appStores";

function getRedirectState(platform) {
  if (platform === "ios") {
    return "ios";
  }

  if (platform === "android") {
    return "android";
  }

  return "unknown";
}

export default function InstallApp() {
  const { t } = useTranslation();
  const platform = useMemo(() => {
    if (typeof window === "undefined") {
      return "unknown";
    }

    return detectDevicePlatform(window.navigator.userAgent);
  }, []);
  const redirectUrl = useMemo(() => getStoreUrlForPlatform(platform), [platform]);
  const redirectState = getRedirectState(platform);

  useEffect(() => {
    if (!redirectUrl) {
      return;
    }

    window.location.replace(redirectUrl);
  }, [redirectUrl]);

  return (
    <main className="installPage">
      <section className="installHero">
        <div className="installCard">
          <div className="installIcon">
            <Smartphone size={34} />
          </div>

          <div className="badge">{t("installApp.badge")}</div>
          <h1>{t("installApp.title")}</h1>
          <p>{t(`installApp.states.${redirectState}`)}</p>

          {redirectUrl ? (
            <div className="installStatusPill">
              <Download size={18} />
              <span>{t("installApp.redirecting")}</span>
            </div>
          ) : null}

          <div className="installActions">
            <a
              href={redirectUrl || IOS_APP_URL}
              className="primaryBtn"
              target="_self"
              rel="noreferrer"
            >
              <ExternalLink size={18} />
              {redirectUrl ? t("installApp.openDetectedStore") : t("installApp.openAppStore")}
            </a>

            <a href={ANDROID_APP_URL} className="secondaryBtn" target="_self" rel="noreferrer">
              <Download size={18} />
              {t("installApp.openPlayStore")}
            </a>
          </div>

          <div className="installStoreGrid">
            <a href={IOS_APP_URL} className="downloadStoreCard">
              <div className="downloadStoreIcon">
                <Download size={22} />
              </div>
              <h2>{t("itemDownload.iosTitle")}</h2>
              <p>{t("itemDownload.iosText")}</p>
            </a>

            <a href={ANDROID_APP_URL} className="downloadStoreCard">
              <div className="downloadStoreIcon">
                <Download size={22} />
              </div>
              <h2>{t("itemDownload.androidTitle")}</h2>
              <p>{t("itemDownload.androidText")}</p>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
