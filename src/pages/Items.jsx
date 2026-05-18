import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeDollarSign, PackageCheck, Repeat, Sparkles } from "lucide-react";
import { fetchPublicItems, formatItemPrice, getDisplayOfferType } from "../lib/publicItems";

function ItemVisual({ item, alt }) {
  if (item.image_url) {
    return <img className="itemCardImage" src={item.image_url} alt={alt} loading="lazy" />;
  }

  return (
    <div className="itemCardPlaceholder">
      <Sparkles size={28} />
    </div>
  );
}

function LoadingItemsGrid({ label }) {
  return (
    <div className="itemsLoadingShell" aria-live="polite" aria-busy="true">
      <div className="itemsLoadingHeader">
        <div className="itemsSpinner" />
        <p>{label}</p>
      </div>

      <div className="itemsGrid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="itemCard itemCardSkeleton" aria-hidden="true">
            <div className="skeletonBlock skeletonImage" />
            <div className="itemCardBody">
              <div className="itemCardMetaRow">
                <span className="skeletonPill" />
                <span className="skeletonPill skeletonPillShort" />
              </div>
              <div className="skeletonLine skeletonTitle" />
              <div className="skeletonLine" />
              <div className="skeletonLine skeletonLineShort" />
              <div className="itemCardFooter">
                <span className="skeletonLine skeletonPrice" />
                <span className="skeletonLine skeletonCta" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Items() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      setError("");

      try {
        const result = await fetchPublicItems();

        if (!cancelled) {
          setItems(result.items);
          setIsConfigured(result.isConfigured);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || t("itemsPage.error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <main className="itemsPage">
      <section className="itemsHero">
        <div className="itemsHeroCopy">
          <div className="badge">{t("itemsPage.badge")}</div>
          <h1>{t("itemsPage.title")}</h1>
          <p>{t("itemsPage.text")}</p>
        </div>
      </section>

      <section className="itemsGridSection">
        {loading ? <LoadingItemsGrid label={t("itemsPage.loading")} /> : null}

        {!loading && !isConfigured ? (
          <div className="itemsStateCard">{t("itemsPage.notConfigured")}</div>
        ) : null}

        {!loading && error ? <div className="itemsStateCard itemsErrorCard">{error}</div> : null}

        {!loading && isConfigured && !error && items.length === 0 ? (
          <div className="itemsStateCard">{t("itemsPage.empty")}</div>
        ) : null}

        {!loading && isConfigured && !error && items.length > 0 ? (
          <div className="itemsGrid">
            {items.map((item) => {
              const offerType = getDisplayOfferType(item);

              return (
                <Link key={item.id} to={`/items/${item.id}`} className="itemCard">
                  <ItemVisual item={item} alt={item.title} />

                  <div className="itemCardBody">
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

                    <h2>{item.title}</h2>
                    <p>{item.description || t("itemsPage.noDescription")}</p>

                    <div className="itemCardFooter">
                      <strong>
                        <BadgeDollarSign size={16} />
                        {offerType === "free" ? t("itemsPage.freePrice") : formatItemPrice(item)}
                      </strong>
                      <span>
                        {t("itemsPage.viewItem")}
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
