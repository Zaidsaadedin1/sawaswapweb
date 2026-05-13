import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Mail, Trash2 } from "lucide-react";

export default function DeleteAccount() {
  const { t } = useTranslation();
  const items = t("deleteAccount.items", { returnObjects: true });

  return (
    <main className="page termsPage">
      <motion.section
        className="pageCard wideCard"
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="badge">{t("deleteAccount.badge")}</span>

        <div className="termsHeader">
          <div>
            <h1>{t("deleteAccount.title")}</h1>
            <p>{t("deleteAccount.intro")}</p>
          </div>

          <div className="termsIcon">
            <Trash2 />
          </div>
        </div>

        <div className="deleteCard">
          <p>{t("deleteAccount.emailInstruction")}</p>

          <a className="deleteMailLink" href="mailto:support@sawaswap.com?subject=Delete%20my%20SawaSwap%20account">
            <Mail />
            <span>support@sawaswap.com</span>
          </a>

          <div className="deleteMeta">
            <div>
              <strong>{t("deleteAccount.subjectLabel")}</strong>
              <span>{t("deleteAccount.subjectValue")}</span>
            </div>

            <div>
              <strong>{t("deleteAccount.includeLabel")}</strong>
              <span>{t("deleteAccount.includeValue")}</span>
            </div>
          </div>
        </div>

        <div className="termsList">
          <article className="termsItem">
            <h2>{t("deleteAccount.deletedTitle")}</h2>
            <ul className="deleteList">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="termsItem">
            <h2>{t("deleteAccount.retentionTitle")}</h2>
            <p>{t("deleteAccount.retentionBody")}</p>
          </article>
        </div>
      </motion.section>
    </main>
  );
}
