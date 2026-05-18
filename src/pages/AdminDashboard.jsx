import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Funnel,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { adminResources } from "../admin/resources";
import { useAdminAuth } from "../context/useAdminAuth";

function toInputValue(value, type) {
  if (value == null) {
    return type === "boolean" ? false : "";
  }

  if (type === "boolean") {
    return Boolean(value);
  }

  if (type === "json") {
    return JSON.stringify(value, null, 2);
  }

  if (type === "datetime-local") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  return String(value);
}

function parseInputValue(value, type) {
  if (type === "boolean") {
    return Boolean(value);
  }

  if (value === "") {
    return null;
  }

  if (type === "number") {
    return Number(value);
  }

  if (type === "json") {
    return JSON.parse(value);
  }

  if (type === "datetime-local") {
    return new Date(value).toISOString();
  }

  return value;
}

function buildInitialForm(resource, record = null) {
  return Object.fromEntries(
    Object.entries(resource.fields).map(([fieldName, fieldConfig]) => [
      fieldName,
      toInputValue(record?.[fieldName], fieldConfig.type),
    ])
  );
}

function getResourceLabel(t, resource) {
  return t(`admin.tables.${resource.table}.label`, { defaultValue: resource.label });
}

function getFieldLabel(t, resource, fieldName) {
  return t(`admin.tables.${resource.table}.fields.${fieldName}`, {
    defaultValue: t(`admin.fields.${fieldName}`, {
      defaultValue: fieldName.replaceAll("_", " "),
    }),
  });
}

function DrawerShell({ title, subtitle, children, onClose }) {
  return (
    <div className="adminDrawerBackdrop" onClick={onClose}>
      <aside className="adminDrawer" onClick={(event) => event.stopPropagation()}>
        <div className="adminDrawerHeader">
          <div>
            <p className="adminOverline">{subtitle}</p>
            <h3>{title}</h3>
          </div>

          <button className="adminIconBtn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {children}
      </aside>
    </div>
  );
}

function ResourceFormDrawer({ resource, mode, record, onClose, onSubmit, busy }) {
  const { t } = useTranslation();
  const [formState, setFormState] = useState(() => buildInitialForm(resource, record));
  const [error, setError] = useState("");
  const resourceLabel = getResourceLabel(t, resource);

  const title =
    mode === "create"
      ? t("admin.drawer.addTitle", { resource: resourceLabel })
      : t("admin.drawer.editTitle", { resource: resourceLabel });

  function updateField(fieldName, nextValue) {
    setFormState((current) => ({
      ...current,
      [fieldName]: nextValue,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = {};

      Object.entries(resource.fields).forEach(([fieldName, fieldConfig]) => {
        if (fieldConfig.readOnly) {
          return;
        }

        if (mode === "create" && fieldConfig.auto) {
          return;
        }

        payload[fieldName] = parseInputValue(formState[fieldName], fieldConfig.type);
      });

      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError.message || t("admin.messages.saveError"));
    }
  }

  return (
    <DrawerShell title={title} subtitle={resource.table} onClose={onClose}>
        {error ? <div className="adminAlert adminAlertError">{error}</div> : null}

        <form className="adminFormGrid" onSubmit={handleSubmit}>
          {Object.entries(resource.fields).map(([fieldName, fieldConfig]) => {
            const value = formState[fieldName];
            const readOnly = fieldConfig.readOnly;

            return (
              <label className="adminField" key={fieldName}>
                <span>{getFieldLabel(t, resource, fieldName)}</span>

                {fieldConfig.type === "textarea" || fieldConfig.type === "json" ? (
                  <textarea
                    value={value}
                    onChange={(event) => updateField(fieldName, event.target.value)}
                    placeholder={getFieldLabel(t, resource, fieldName)}
                    readOnly={readOnly}
                    required={fieldConfig.required}
                    rows={fieldConfig.type === "json" ? 7 : 4}
                  />
                ) : null}

                {fieldConfig.type === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => updateField(fieldName, event.target.checked)}
                    disabled={readOnly}
                  />
                ) : null}

                {fieldConfig.type === "select" ? (
                  <select
                    value={value}
                    onChange={(event) => updateField(fieldName, event.target.value)}
                    disabled={readOnly}
                    required={fieldConfig.required}
                  >
                    <option value="">{t("admin.form.select")}</option>
                    {fieldConfig.options.map((option) => (
                      <option key={option} value={option}>
                        {t(`admin.options.${option}`, { defaultValue: option })}
                      </option>
                    ))}
                  </select>
                ) : null}

                {!["textarea", "json", "boolean", "select"].includes(fieldConfig.type) ? (
                  <input
                    type={fieldConfig.type || "text"}
                    value={value}
                    onChange={(event) => updateField(fieldName, event.target.value)}
                    placeholder={getFieldLabel(t, resource, fieldName)}
                    readOnly={readOnly}
                    required={fieldConfig.required}
                    step={fieldConfig.step}
                  />
                ) : null}
              </label>
            );
          })}

          <div className="adminModalActions">
            <button className="adminSecondaryBtn" type="button" onClick={onClose}>
              {t("admin.actions.cancel")}
            </button>
            <button className="adminPrimaryBtn" type="submit" disabled={busy}>
              {busy ? t("admin.actions.saving") : t("admin.actions.save")}
            </button>
          </div>
        </form>
    </DrawerShell>
  );
}

function RecordViewDrawer({ resource, record, onClose }) {
  const { t } = useTranslation();

  return (
    <DrawerShell
      title={t("admin.drawer.viewTitle", { resource: getResourceLabel(t, resource) })}
      subtitle={resource.table}
      onClose={onClose}
    >
        <pre className="adminCodeBlock">{JSON.stringify(record, null, 2)}</pre>
    </DrawerShell>
  );
}

function formatCellValue(value) {
  if (value == null) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function withTradeOfferReviewFields(resource, payload) {
  if (resource.table !== "trade_offers") {
    return payload;
  }

  if (payload.admin_review_status === "approved" || payload.admin_review_status === "cancelled") {
    return {
      ...payload,
      admin_reviewed_at: new Date().toISOString(),
    };
  }

  return {
    ...payload,
    admin_reviewed_at: null,
  };
}

function AdminResourcePanel({ resource, supabase }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortColumn, setSortColumn] = useState(resource.defaultSort.column);
  const [sortAscending, setSortAscending] = useState(resource.defaultSort.ascending);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewRecord, setViewRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const resourceLabel = getResourceLabel(t, resource);

  const visibleColumns = useMemo(
    () => resource.previewColumns || Object.keys(resource.fields).slice(0, 6),
    [resource.fields, resource.previewColumns]
  );
  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      visibleColumns.some((column) => String(formatCellValue(row[column])).toLowerCase().includes(query))
    );
  }, [rows, searchTerm, visibleColumns]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from(resource.table)
      .select("*")
      .order(sortColumn, { ascending: sortAscending })
      .limit(50);

    if (queryError) {
      setRows([]);
      setError(queryError.message || t("admin.messages.loadError", { resource: resourceLabel }));
      setLoading(false);
      return;
    }

    setRows(data || []);
    setLoading(false);
  }, [resource.table, resourceLabel, sortAscending, sortColumn, supabase, t]);

  useEffect(() => {
    queueMicrotask(loadRows);
  }, [loadRows]);

  async function handleCreate(payload) {
    setBusy(true);

    try {
      const normalizedPayload = withTradeOfferReviewFields(resource, payload);
      const { error: insertError } = await supabase.from(resource.table).insert(normalizedPayload);

      if (insertError) {
        throw insertError;
      }

      setIsCreating(false);
      await loadRows();
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(payload) {
    setBusy(true);

    try {
      const normalizedPayload = withTradeOfferReviewFields(resource, payload);
      const { error: updateError } = await supabase
        .from(resource.table)
        .update(normalizedPayload)
        .eq(resource.primaryKey, editingRecord[resource.primaryKey]);

      if (updateError) {
        throw updateError;
      }

      setEditingRecord(null);
      await loadRows();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(record) {
    const confirmed = window.confirm(
      t("admin.messages.deleteConfirm", {
        resource: resource.table,
        id: record[resource.primaryKey],
      })
    );

    if (!confirmed) {
      return;
    }

    setBusy(true);

    try {
      const { error: deleteError } = await supabase
        .from(resource.table)
        .delete()
        .eq(resource.primaryKey, record[resource.primaryKey]);

      if (deleteError) {
        throw deleteError;
      }

      await loadRows();
    } catch (deleteError) {
      setError(deleteError.message || t("admin.messages.deleteError", { resource: resourceLabel }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adminPanel">
      <div className="adminPanelHeader">
        <div>
          <p className="adminOverline">{resource.table}</p>
          <h2>{resourceLabel}</h2>
          <p className="adminPanelMeta">{t("admin.panel.meta")}</p>
        </div>

        <div className="adminPanelActions">
          <label className="adminSearchBox">
            <Search size={16} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("admin.panel.searchPlaceholder")}
            />
          </label>

          <div className="adminSortBox">
            <Funnel size={16} />
            <select value={sortColumn} onChange={(event) => setSortColumn(event.target.value)}>
              {Object.keys(resource.fields).map((fieldName) => (
                <option key={fieldName} value={fieldName}>
                  {getFieldLabel(t, resource, fieldName)}
                </option>
              ))}
            </select>
            <select
              value={sortAscending ? "asc" : "desc"}
              onChange={(event) => setSortAscending(event.target.value === "asc")}
            >
              <option value="asc">{t("admin.panel.sortAsc")}</option>
              <option value="desc">{t("admin.panel.sortDesc")}</option>
            </select>
          </div>

          <button className="adminSecondaryBtn" type="button" onClick={loadRows}>
            <RefreshCw size={16} />
            {t("admin.actions.refresh")}
          </button>

          <button className="adminPrimaryBtn" type="button" onClick={() => setIsCreating(true)}>
            <Plus size={16} />
            {t("admin.actions.add")}
          </button>
        </div>
      </div>

      <p className="adminResultsMeta">
        {t("admin.panel.results", { count: filteredRows.length, total: rows.length })}
      </p>

      {error ? <div className="adminAlert adminAlertError">{error}</div> : null}

      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              {visibleColumns.map((column) => (
                <th key={column}>{getFieldLabel(t, resource, column)}</th>
              ))}
              <th>{t("admin.panel.actionsHeader")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="adminTableEmpty">
                  {t("admin.messages.loading")}
                </td>
              </tr>
            ) : null}

            {!loading && filteredRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="adminTableEmpty">
                  {searchTerm ? t("admin.messages.noSearchResults") : t("admin.messages.noRecords")}
                </td>
              </tr>
            ) : null}

            {!loading
              ? filteredRows.map((row) => (
                  <tr key={row[resource.primaryKey]}>
                    {visibleColumns.map((column) => (
                      <td key={column}>{formatCellValue(row[column])}</td>
                    ))}
                    <td>
                      <div className="adminRowActions">
                        <button
                          className="adminIconBtn"
                          type="button"
                          onClick={() => setViewRecord(row)}
                          title={t("admin.actions.view")}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="adminIconBtn"
                          type="button"
                          onClick={() => setEditingRecord(row)}
                          title={t("admin.actions.edit")}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="adminIconBtn adminDangerBtn"
                          type="button"
                          onClick={() => handleDelete(row)}
                          title={t("admin.actions.delete")}
                          disabled={busy}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {isCreating ? (
        <ResourceFormDrawer
          key={`${resource.table}-create`}
          resource={resource}
          mode="create"
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreate}
          busy={busy}
        />
      ) : null}

      {editingRecord ? (
        <ResourceFormDrawer
          key={`${resource.table}-edit-${editingRecord[resource.primaryKey]}`}
          resource={resource}
          mode="edit"
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSubmit={handleUpdate}
          busy={busy}
        />
      ) : null}

      {viewRecord ? (
        <RecordViewDrawer
          resource={resource}
          record={viewRecord}
          onClose={() => setViewRecord(null)}
        />
      ) : null}
    </section>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { profile, signOut, supabase } = useAdminAuth();
  const [activeTable, setActiveTable] = useState(adminResources[0].table);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    document.title = `${t("admin.dashboard.pageTitle")} | SawaSwap`;
  }, [t]);

  const activeResource =
    adminResources.find((resource) => resource.table === activeTable) || adminResources[0];

  async function handleSignOut() {
    setSignOutError("");

    try {
      await signOut();
    } catch (error) {
      setSignOutError(error.message || t("admin.messages.signOutError"));
    }
  }

  return (
    <main className="adminShell adminDashboardShell">
      <aside className="adminSidebar">
        <div className="adminBrand">
          <div className="adminBrandIcon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <strong>{t("admin.dashboard.brand")}</strong>
            <p>{profile?.full_name || profile?.username || profile?.id}</p>
          </div>
        </div>

        <nav className="adminNav">
          {adminResources.map((resource) => (
            <button
              key={resource.table}
              className={resource.table === activeTable ? "adminNavItem active" : "adminNavItem"}
              type="button"
              onClick={() => setActiveTable(resource.table)}
            >
              <span>{getResourceLabel(t, resource)}</span>
              <small>{resource.table}</small>
            </button>
          ))}
        </nav>

        {signOutError ? <div className="adminAlert adminAlertError">{signOutError}</div> : null}

        <button className="adminSecondaryBtn adminSignOutBtn" type="button" onClick={handleSignOut}>
          <LogOut size={16} />
          {t("admin.actions.signOut")}
        </button>
      </aside>

      <section className="adminContent">
        <div className="adminHero">
          <div>
            <p className="adminOverline">{t("admin.dashboard.badge")}</p>
            <h1>{t("admin.dashboard.title")}</h1>
            <p>{t("admin.dashboard.text")}</p>
          </div>
        </div>

        <AdminResourcePanel key={activeResource.table} resource={activeResource} supabase={supabase} />
      </section>
    </main>
  );
}
