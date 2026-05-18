import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Funnel,
  Globe2,
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
      fieldConfig.getInitialValue
        ? fieldConfig.getInitialValue(record)
        : toInputValue(record?.[fieldName], fieldConfig.type),
    ])
  );
}

function isFieldVisible(fieldConfig, formState) {
  if (fieldConfig.hideInForm) {
    return false;
  }

  if (!fieldConfig.showWhen) {
    return true;
  }

  return Boolean(fieldConfig.showWhen(formState));
}

function isFieldRequired(fieldConfig, formState) {
  if (fieldConfig.requiredWhen) {
    return Boolean(fieldConfig.requiredWhen(formState));
  }

  return Boolean(fieldConfig.required);
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
  const { t } = useTranslation();

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

        <div className="adminDrawerCloseRow">
          <button className="adminSecondaryBtn" type="button" onClick={onClose}>
            {t("admin.actions.close")}
          </button>
        </div>

        {children}
      </aside>
    </div>
  );
}

function ResourceFormDrawer({ resource, mode, record, onClose, onSubmit, busy, supabase }) {
  const { t } = useTranslation();
  const [formState, setFormState] = useState(() => buildInitialForm(resource, record));
  const [error, setError] = useState("");
  const [selectOptions, setSelectOptions] = useState({});
  const resourceLabel = getResourceLabel(t, resource);
  const isViewMode = mode === "view";

  const title =
    mode === "create"
      ? t("admin.drawer.addTitle", { resource: resourceLabel })
      : isViewMode
        ? t("admin.drawer.viewTitle", { resource: resourceLabel })
        : t("admin.drawer.editTitle", { resource: resourceLabel });

  function updateField(fieldName, nextValue) {
    setFormState((current) => ({
      ...current,
      [fieldName]: nextValue,
    }));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSelectOptions() {
      const fieldsWithRemoteOptions = Object.entries(resource.fields).filter(
        ([, fieldConfig]) => fieldConfig.optionsSource
      );

      if (fieldsWithRemoteOptions.length === 0) {
        setSelectOptions({});
        return;
      }

      const optionEntries = await Promise.all(
        fieldsWithRemoteOptions.map(async ([fieldName, fieldConfig]) => {
          const { table, orderBy, mapOption } = fieldConfig.optionsSource;
          let query = supabase.from(table).select("*");

          if (orderBy?.column) {
            query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
          }

          const { data, error: optionsError } = await query.limit(200);

          if (optionsError) {
            throw optionsError;
          }

          return [
            fieldName,
            (data || []).map((row) =>
              mapOption ? mapOption(row) : { value: row.id, label: row.name || row.id }
            ),
          ];
        })
      );

      if (!cancelled) {
        setSelectOptions(Object.fromEntries(optionEntries));
      }
    }

    loadSelectOptions().catch((loadError) => {
      if (!cancelled) {
        setError(loadError.message || t("admin.messages.loadError", { resource: resourceLabel }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resource, resourceLabel, supabase, t]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = {};

      Object.entries(resource.fields).forEach(([fieldName, fieldConfig]) => {
        if (fieldConfig.readOnly || isViewMode || !isFieldVisible(fieldConfig, formState)) {
          return;
        }

        if (mode === "create" && fieldConfig.auto) {
          return;
        }

        if (fieldConfig.virtual) {
          return;
        }

        if (isFieldRequired(fieldConfig, formState) && formState[fieldName] === "") {
          throw new Error(
            t("admin.messages.requiredField", {
              field: getFieldLabel(t, resource, fieldName),
            })
          );
        }

        payload[fieldName] = parseInputValue(formState[fieldName], fieldConfig.type);
      });

      await onSubmit(payload, formState);
    } catch (submitError) {
      setError(submitError.message || t("admin.messages.saveError"));
    }
  }

  return (
    <DrawerShell title={title} subtitle={resource.table} onClose={onClose}>
      {error ? <div className="adminAlert adminAlertError">{error}</div> : null}

      <form className="adminFormGrid" onSubmit={handleSubmit}>
        {Object.entries(resource.fields).map(([fieldName, fieldConfig]) => {
          if (!isFieldVisible(fieldConfig, formState)) {
            return null;
          }

          const value = formState[fieldName];
          const readOnly = fieldConfig.readOnly || isViewMode;
          const required = isFieldRequired(fieldConfig, formState);
          const options = fieldConfig.optionsSource ? selectOptions[fieldName] || [] : fieldConfig.options || [];

          return (
            <label className="adminField" key={fieldName}>
              <span>{getFieldLabel(t, resource, fieldName)}</span>

              {fieldConfig.type === "textarea" || fieldConfig.type === "json" ? (
                <textarea
                  value={value}
                  onChange={(event) => updateField(fieldName, event.target.value)}
                  placeholder={getFieldLabel(t, resource, fieldName)}
                  readOnly={readOnly}
                  required={required}
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
                  required={required}
                >
                  <option value="">{t("admin.form.select")}</option>
                  {options.map((option) => (
                    <option
                      key={typeof option === "string" ? option : option.value}
                      value={typeof option === "string" ? option : option.value}
                    >
                      {typeof option === "string"
                        ? t(`admin.options.${option}`, { defaultValue: option })
                        : option.label}
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
                  required={required}
                  step={fieldConfig.step}
                />
              ) : null}
            </label>
          );
        })}

        {!isViewMode ? (
          <div className="adminModalActions">
            <button className="adminSecondaryBtn" type="button" onClick={onClose}>
              {t("admin.actions.cancel")}
            </button>
            <button className="adminPrimaryBtn" type="submit" disabled={busy}>
              {busy ? t("admin.actions.saving") : t("admin.actions.save")}
            </button>
          </div>
        ) : null}
      </form>
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

function withItemModerationFields(resource, payload, formState) {
  if (resource.table !== "items") {
    return payload;
  }

  if (formState.moderation_status === "accepted") {
    return {
      ...payload,
      accepted: true,
      review_reason_id: null,
    };
  }

  if (formState.moderation_status === "rejected") {
    return {
      ...payload,
      accepted: false,
    };
  }

  return {
    ...payload,
    accepted: null,
    review_reason_id: null,
  };
}

function normalizePayload(resource, payload, formState) {
  const withTradeOfferFields = withTradeOfferReviewFields(resource, payload);
  return withItemModerationFields(resource, withTradeOfferFields, formState);
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

  async function handleCreate(payload, formState) {
    setBusy(true);

    try {
      const normalizedPayload = normalizePayload(resource, payload, formState);
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

  async function handleUpdate(payload, formState) {
    setBusy(true);

    try {
      const normalizedPayload = normalizePayload(resource, payload, formState);
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
          supabase={supabase}
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
          supabase={supabase}
        />
      ) : null}

      {viewRecord ? (
        <ResourceFormDrawer
          key={`${resource.table}-view-${viewRecord[resource.primaryKey]}`}
          resource={resource}
          mode="view"
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          onSubmit={async () => {}}
          busy={false}
          supabase={supabase}
        />
      ) : null}
    </section>
  );
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
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

  function toggleLanguage() {
    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
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

        <button className="adminSecondaryBtn adminLangBtn" type="button" onClick={toggleLanguage}>
          <Globe2 size={16} />
          {i18n.language === "en"
            ? t("admin.actions.switchToArabic")
            : t("admin.actions.switchToEnglish")}
        </button>

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
