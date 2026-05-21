import { useEffect, useState } from "react";
import { Shield, ShieldAlert } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "../context/useAdminAuth";

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, isAdmin, loading, error: authError, supabase } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/admin/dashboard";

  useEffect(() => {
    document.title = `${t("admin.login.pageTitle")} | SawaSwap`;
  }, [t]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAdmin, loading, navigate, redirectTo, user]);

  if (!supabase) {
    return (
      <main className="adminShell">
        <section className="adminAuthCard">
          <div className="adminAuthBadge">
            <ShieldAlert size={16} />
            {t("admin.login.missingConfigBadge")}
          </div>
          <h1>{t("admin.login.missingConfigTitle")}</h1>
          <p>{t("admin.login.missingConfigText")}</p>
        </section>
      </main>
    );
  }

  if (!loading && user && isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn(email, password);
      if (result?.session?.user?.id) {
        return;
      }

      throw new Error(t("admin.login.accessCheckError"));
    } catch (signInError) {
      setError(signInError.message || t("admin.login.signInError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="adminShell">
      <section className="adminAuthCard">
        <div className="adminAuthBadge">
          <Shield size={16} />
          {t("admin.login.restrictedBadge")}
        </div>

        <h1>{t("admin.login.title")}</h1>

        {authError ? <div className="adminAlert adminAlertError">{authError}</div> : null}
        {error ? <div className="adminAlert adminAlertError">{error}</div> : null}

        <form className="adminAuthForm" onSubmit={handleSubmit}>
          <label className="adminField">
            <span>{t("admin.fields.email")}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("admin.login.emailPlaceholder")}
              autoComplete="email"
              required
            />
          </label>

          <label className="adminField">
            <span>{t("admin.fields.password")}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("admin.login.passwordPlaceholder")}
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="adminPrimaryBtn"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("admin.login.signingIn") : t("admin.login.submit")}
          </button>
        </form>
      </section>
    </main>
  );
}
