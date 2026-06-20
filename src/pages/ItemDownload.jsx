import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeDollarSign, Download, PackageCheck, Repeat, Smartphone } from "lucide-react";
import { fetchPublicItemById, formatItemPrice, getDisplayOfferType } from "../lib/publicItems";
import { ANDROID_APP_URL, IOS_APP_URL } from "../lib/appStores";

function handleStoreClick(url, event) {
  if (!url) {
    event.preventDefault();
  }
}

function DownloadLoadingState({ label }) {
  return (
    <main className="itemDownloadPage">
      <section className="itemDownloadSkeletonShell" aria-live="polite" aria-busy="true">
        <div className="itemsLoadingHeader">
          <div className="itemsSpinner" />
          <p>{label}</p>
        </div>

        <div className="itemDownloadLayout">
          <article className="itemPreviewCard itemCardSkeleton" aria-hidden="true">
            <div className="skeletonBlock skeletonImage" />
            <div className="itemPreviewBody">
              <div className="itemCardMetaRow">
                <span className="skeletonPill" />
                <span className="skeletonPill skeletonPillShort" />
              </div>
              <div className="skeletonLine skeletonTitle" />
              <div className="skeletonLine" />
              <div className="skeletonLine skeletonLineShort" />
              <div className="skeletonLine skeletonPrice" />
            </div>
          </article>

          <section className="downloadCardsPanel" aria-hidden="true">
            <div className="itemsStateCard">
              <div className="skeletonLine skeletonCta" />
              <div className="skeletonLine skeletonTitle" />
              <div className="skeletonLine" />
            </div>
            <div className="downloadCardsGrid">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="downloadStoreCard itemCardSkeleton">
                  <div className="skeletonSquare" />
                  <div className="skeletonLine skeletonStoreTitle" />
                  <div className="skeletonLine" />
                  <div className="skeletonLine skeletonLineShort" />
                  <div className="skeletonButton" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default function ItemDownload() {
  const { t } = useTranslation();
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadItem() {
      setLoading(true);
      setError("");

      try {
        const result = await fetchPublicItemById(itemId);

        if (!cancelled) {
          setItem(result.item);
          setIsConfigured(result.isConfigured);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || t("itemDownload.error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadItem();

    return () => {
      cancelled = true;
    };
  }, [itemId, t]);

  if (loading) {
    return <DownloadLoadingState label={t("itemDownload.loading")} />;
  }

  if (!isConfigured) {
    return (
      <main className="itemDownloadPage">
        <section className="itemDownloadState">{t("itemDownload.notConfigured")}</section>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="itemDownloadPage">
        <section className="itemDownloadState">
          {error || t("itemDownload.notFound")}
          <div className="itemDownloadBackRow">
            <Link to="/items" className="secondaryBtn">
              {t("itemDownload.backToItems")}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const offerType = getDisplayOfferType(item);

  return (
    <main className="itemDownloadPage">
      <section className="itemDownloadHero">
        <Link to="/items" className="backLink">
          <ArrowLeft size={16} />
          {t("itemDownload.backToItems")}
        </Link>

        <div className="itemDownloadLayout">
          <article className="itemPreviewCard">
            {item.image_url ? (
              <img className="itemPreviewImage" src={item.image_url} alt={item.title} />
            ) : (
              <div className="itemPreviewPlaceholder">
                <Smartphone size={32} />
              </div>
            )}

            <div className="itemPreviewBody">
              <div className="itemCardMetaRow">
                <span className="itemPill itemPillType">
                  <Repeat size={14} />
                  {t(`itemsPage.offerTypes.${offerType}`)}
                </span>
                <span className="itemPill">
                  <PackageCheck size={14} />
                  {t(`admin.options.${item.status}`, { defaultValue: item.status })}
                </span>
              </div>

              <h1>{item.title}</h1>
              <p>{item.description || t("itemsPage.noDescription")}</p>

              <strong className="itemPreviewPrice">
                <BadgeDollarSign size={18} />
                {offerType === "free" ? t("itemsPage.freePrice") : formatItemPrice(item)}
              </strong>
            </div>
          </article>

          <section className="downloadCardsPanel">
            <div className="downloadPanelIntro">
              <div className="badge">{t("itemDownload.badge")}</div>
              <h2>{t("itemDownload.title")}</h2>
              <p>{t("itemDownload.text")}</p>
            </div>

            <div className="downloadCardsGrid">
              <a
                href={ANDROID_APP_URL || "#"}
                className={`downloadStoreCard${ANDROID_APP_URL ? "" : " isDisabled"}`}
                onClick={(event) => handleStoreClick(ANDROID_APP_URL, event)}
              >
                <div className="downloadStoreIcon">
                  <Download size={22} />
                </div>
                <h3>{t("itemDownload.androidTitle")}</h3>
                <p>{t("itemDownload.androidText")}</p>
                <span className="primaryBtn downloadStoreBtn">
                  {ANDROID_APP_URL ? t("itemDownload.downloadNow") : t("itemDownload.comingSoon")}
                </span>
              </a>

              <a
                href={IOS_APP_URL || "#"}
                className={`downloadStoreCard${IOS_APP_URL ? "" : " isDisabled"}`}
                onClick={(event) => handleStoreClick(IOS_APP_URL, event)}
              >
                <div className="downloadStoreIcon">
                  <Download size={22} />
                </div>
                <h3>{t("itemDownload.iosTitle")}</h3>
                <p>{t("itemDownload.iosText")}</p>
                <span className="primaryBtn downloadStoreBtn">
                  {IOS_APP_URL ? t("itemDownload.downloadNow") : t("itemDownload.comingSoon")}
                </span>
              </a>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
