import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "../context/useAdminAuth";

function AdminLoadingScreen() {
  const { t } = useTranslation();

  return (
    <main className="adminShell adminLoadingShell">
      <div className="adminEmptyState">
        <ShieldAlert size={28} />
        <h2>{t("admin.route.loadingTitle")}</h2>
        <p>{t("admin.route.loadingText")}</p>
      </div>
    </main>
  );
}

export default function AdminRoute() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, isAdmin, loading, error } = useAdminAuth();

  if (loading) {
    return <AdminLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <main className="adminShell adminLoadingShell">
        <div className="adminEmptyState">
          <ShieldAlert size={28} />
          <h2>{t("admin.route.deniedTitle")}</h2>
          <p>{error || t("admin.route.deniedText")}</p>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
