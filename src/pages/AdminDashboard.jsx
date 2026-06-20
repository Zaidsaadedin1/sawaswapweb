import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, createTheme } from "@mui/material/styles";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  AlertTriangle,
  Ban,
  BarChart3,
  Bell,
  Bookmark,
  ClipboardList,
  Columns3,
  Eye,
  Filter,
  GalleryHorizontal,
  Heart,
  Image,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircleMore,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  ScanSearch,
  ScrollText,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Trash2,
  User,
  UserRound,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { adminResources } from "../admin/resources";
import TopBar from "../components/TopBar";
import { useAdminAuth } from "../context/useAdminAuth";

const OVERVIEW_VIEW = "__overview__";
const AUDIT_ONLY_TABLES = new Set(["blocked_users", "terms_acceptance"]);
const ITEM_REVIEW_REASON_CODES = [
  "missing_details",
  "inappropriate_content",
  "prohibited_item",
  "duplicate_listing",
  "spam",
  "other",
];

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f766e",
      dark: "#115e59",
      light: "#5eead4",
    },
    secondary: {
      main: "#f97316",
    },
    background: {
      default: "#f3efe7",
      paper: "#fffdfa",
    },
    success: {
      main: "#15803d",
    },
    warning: {
      main: "#d97706",
    },
    error: {
      main: "#b91c1c",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
});

const DEFAULT_TABLE_ICON = LayoutGrid;
const TABLE_ICONS = {
  blocked_users: Ban,
  categories: Tag,
  favorites: Heart,
  filter_seed: Filter,
  item_filters: SlidersHorizontal,
  item_images: Image,
  items: GalleryHorizontal,
  match_messages: MessageSquare,
  matches: Users,
  notifications: Bell,
  offer_messages: Send,
  profiles: UserRound,
  reports: ShieldAlert,
  swipes: ScanSearch,
  terms_acceptance: ScrollText,
  trade_offers: ClipboardList,
  user_push_tokens: Bookmark,
};

function getTableIcon(resource) {
  return TABLE_ICONS[resource.table] || DEFAULT_TABLE_ICON;
}

function isDateTimeField(resource, column) {
  return resource.fields?.[column]?.type === "datetime-local";
}

function formatDateTimeValue(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isProbablyImageUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmedValue = value.trim().toLowerCase();
  return /^https?:\/\//.test(trimmedValue) && /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/.test(trimmedValue);
}

function getModerationDisplayValue(resource, column, row) {
  if (column === "moderation_status") {
    if (resource.table === "items") {
      if (row.accepted === true) {
        return "accepted";
      }

      if (row.accepted === false) {
        return "rejected";
      }
    }
  }

  return row[column];
}

function formatValue(resource, column, row) {
  const value = getModerationDisplayValue(resource, column, row);

  if (value == null || value === "") {
    return "—";
  }

  if (isDateTimeField(resource, column)) {
    return formatDateTimeValue(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (entry && typeof entry === "object") {
          return entry.image_url || JSON.stringify(entry);
        }

        return String(entry);
      })
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function compareValues(left, right) {
  if (left == null || left === "") {
    return right == null || right === "" ? 0 : 1;
  }

  if (right == null || right === "") {
    return -1;
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  const leftDate = Date.parse(left);
  const rightDate = Date.parse(right);

  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return leftDate - rightDate;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getColumnList(resource, rows) {
  const declaredColumns = Object.keys(resource.fields);
  const rowColumns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row || {})).filter((column) => !declaredColumns.includes(column)))
  );

  return [...declaredColumns, ...rowColumns];
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getProfileName(profile, fallbackId = "") {
  if (!profile) {
    return fallbackId || "Unknown user";
  }

  return profile.full_name || profile.username || fallbackId || profile.id;
}

async function loadProfilesMap(supabase, userIds) {
  const nextUserIds = uniqueValues(userIds);

  if (nextUserIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", nextUserIds);

  if (error) {
    throw error;
  }

  return Object.fromEntries((data || []).map((profile) => [profile.id, profile]));
}

function groupRowsBy(rows, key) {
  return rows.reduce((accumulator, row) => {
    const groupKey = row[key];

    if (!groupKey) {
      return accumulator;
    }

    if (!accumulator[groupKey]) {
      accumulator[groupKey] = [];
    }

    accumulator[groupKey].push(row);
    return accumulator;
  }, {});
}

function buildConversationThread(messages, profilesById) {
  return (messages || [])
    .map((messageRow) => `${getProfileName(profilesById[messageRow.sender_id], messageRow.sender_id)}: ${messageRow.message}`)
    .join("\n\n");
}

async function enrichMatchRows(rows, supabase) {
  const matchIds = uniqueValues(rows.map((row) => row.id));
  const userIds = uniqueValues(rows.flatMap((row) => [row.owner_id, row.interested_user_id]));
  const [profilesById, matchMessagesResult] = await Promise.all([
    loadProfilesMap(supabase, userIds),
    matchIds.length
      ? supabase.from("match_messages").select("id, match_id, sender_id, message, created_at").in("match_id", matchIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (matchMessagesResult.error) {
    throw matchMessagesResult.error;
  }

  const messagesByMatchId = groupRowsBy(matchMessagesResult.data || [], "match_id");

  return rows.map((row) => {
    const ownerProfile = profilesById[row.owner_id];
    const interestedProfile = profilesById[row.interested_user_id];

    return {
      ...row,
      owner_name: getProfileName(ownerProfile, row.owner_id),
      interested_user_name: getProfileName(interestedProfile, row.interested_user_id),
      conversation_participants: `${getProfileName(ownerProfile, row.owner_id)} <-> ${getProfileName(interestedProfile, row.interested_user_id)}`,
      conversation_thread: buildConversationThread(messagesByMatchId[row.id], profilesById),
    };
  });
}

async function enrichMatchMessageRows(rows, supabase) {
  const matchIds = uniqueValues(rows.map((row) => row.match_id));
  const { data: matches, error: matchesError } = await supabase.from("matches").select("id, owner_id, interested_user_id").in("id", matchIds);

  if (matchesError) {
    throw matchesError;
  }

  const matchesById = Object.fromEntries((matches || []).map((matchRow) => [matchRow.id, matchRow]));
  const userIds = uniqueValues(
    rows.flatMap((row) => {
      const matchRow = matchesById[row.match_id];
      return [row.sender_id, matchRow?.owner_id, matchRow?.interested_user_id];
    })
  );

  const [profilesById, allMessagesResult] = await Promise.all([
    loadProfilesMap(supabase, userIds),
    matchIds.length
      ? supabase.from("match_messages").select("id, match_id, sender_id, message, created_at").in("match_id", matchIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (allMessagesResult.error) {
    throw allMessagesResult.error;
  }

  const messagesByMatchId = groupRowsBy(allMessagesResult.data || [], "match_id");

  return rows.map((row) => {
    const matchRow = matchesById[row.match_id];
    const ownerProfile = profilesById[matchRow?.owner_id];
    const interestedProfile = profilesById[matchRow?.interested_user_id];
    const senderProfile = profilesById[row.sender_id];

    return {
      ...row,
      sender_name: getProfileName(senderProfile, row.sender_id),
      conversation_participants: `${getProfileName(ownerProfile, matchRow?.owner_id)} <-> ${getProfileName(interestedProfile, matchRow?.interested_user_id)}`,
      conversation_thread: buildConversationThread(messagesByMatchId[row.match_id], profilesById),
    };
  });
}

async function enrichOfferMessageRows(rows, supabase) {
  const offerIds = uniqueValues(rows.map((row) => row.offer_id));
  const { data: offers, error: offersError } = await supabase.from("trade_offers").select("id, requester_id, owner_id").in("id", offerIds);

  if (offersError) {
    throw offersError;
  }

  const offersById = Object.fromEntries((offers || []).map((offerRow) => [offerRow.id, offerRow]));
  const userIds = uniqueValues(
    rows.flatMap((row) => {
      const offerRow = offersById[row.offer_id];
      return [row.sender_id, offerRow?.requester_id, offerRow?.owner_id];
    })
  );

  const [profilesById, allMessagesResult] = await Promise.all([
    loadProfilesMap(supabase, userIds),
    offerIds.length
      ? supabase.from("offer_messages").select("id, offer_id, sender_id, message, created_at").in("offer_id", offerIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (allMessagesResult.error) {
    throw allMessagesResult.error;
  }

  const messagesByOfferId = groupRowsBy(allMessagesResult.data || [], "offer_id");

  return rows.map((row) => {
    const offerRow = offersById[row.offer_id];
    const requesterProfile = profilesById[offerRow?.requester_id];
    const ownerProfile = profilesById[offerRow?.owner_id];
    const senderProfile = profilesById[row.sender_id];

    return {
      ...row,
      sender_name: getProfileName(senderProfile, row.sender_id),
      conversation_participants: `${getProfileName(requesterProfile, offerRow?.requester_id)} <-> ${getProfileName(ownerProfile, offerRow?.owner_id)}`,
      conversation_thread: buildConversationThread(messagesByOfferId[row.offer_id], profilesById),
    };
  });
}

async function enrichSwipeRows(rows, supabase) {
  const itemIds = uniqueValues(rows.map((row) => row.item_id));
  const { data: items, error: itemsError } = await supabase.from("items").select("id, title, owner_id").in("id", itemIds);

  if (itemsError) {
    throw itemsError;
  }

  const itemsById = Object.fromEntries((items || []).map((itemRow) => [itemRow.id, itemRow]));
  const userIds = uniqueValues(rows.flatMap((row) => [row.user_id, itemsById[row.item_id]?.owner_id]));
  const profilesById = await loadProfilesMap(supabase, userIds);

  return rows.map((row) => ({
    ...row,
    user_name: getProfileName(profilesById[row.user_id], row.user_id),
    item_title: itemsById[row.item_id]?.title || row.item_id,
    item_owner_name: getProfileName(profilesById[itemsById[row.item_id]?.owner_id], itemsById[row.item_id]?.owner_id),
  }));
}

async function enrichAdminRows(resource, rows, supabase) {
  switch (resource.table) {
    case "matches":
      return enrichMatchRows(rows, supabase);
    case "match_messages":
      return enrichMatchMessageRows(rows, supabase);
    case "offer_messages":
      return enrichOfferMessageRows(rows, supabase);
    case "swipes":
      return enrichSwipeRows(rows, supabase);
    default:
      return rows;
  }
}

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

    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
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
      fieldConfig.getInitialValue ? fieldConfig.getInitialValue(record) : toInputValue(record?.[fieldName], fieldConfig.type),
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
    defaultValue: fieldName.replaceAll("_", " "),
  });
}

function getOptionLabel(t, value) {
  if (typeof value === "boolean") {
    return t(`admin.options.${value}`, { defaultValue: value ? "True" : "False" });
  }

  if (value == null || value === "") {
    return t("admin.options.empty", { defaultValue: "—" });
  }

  return t(`admin.options.${value}`, { defaultValue: String(value) });
}

function getGridLocaleText(t) {
  return {
    toolbarColumns: t("admin.grid.toolbarColumns"),
    toolbarFilters: t("admin.grid.toolbarFilters"),
    toolbarDensity: t("admin.grid.toolbarDensity"),
    toolbarExport: t("admin.grid.toolbarExport"),
    toolbarQuickFilterPlaceholder: t("admin.grid.toolbarQuickFilterPlaceholder"),
    toolbarQuickFilterLabel: t("admin.grid.toolbarQuickFilterLabel"),
    toolbarQuickFilterDeleteIconLabel: t("admin.grid.toolbarQuickFilterDeleteIconLabel"),
    columnsManagementSearchTitle: t("admin.grid.columnsManagementSearchTitle"),
    columnsManagementNoColumns: t("admin.grid.columnsManagementNoColumns"),
    columnsManagementShowHideAllText: t("admin.grid.columnsManagementShowHideAllText"),
    filterPanelAddFilter: t("admin.grid.filterPanelAddFilter"),
    filterPanelDeleteIconLabel: t("admin.grid.filterPanelDeleteIconLabel"),
    filterPanelOperator: t("admin.grid.filterPanelOperator"),
    filterPanelColumns: t("admin.grid.filterPanelColumns"),
    filterPanelInputLabel: t("admin.grid.filterPanelInputLabel"),
    filterPanelInputPlaceholder: t("admin.grid.filterPanelInputPlaceholder"),
    noRowsLabel: t("admin.grid.noRowsLabel"),
    noResultsOverlayLabel: t("admin.grid.noResultsOverlayLabel"),
    footerRowSelected: (count) => t("admin.grid.footerRowSelected", { count }),
    footerTotalRows: t("admin.grid.footerTotalRows"),
    footerPaginationRowsPerPage: t("admin.grid.footerPaginationRowsPerPage"),
    MuiTablePagination: {
      labelDisplayedRows: ({ from, to, count }) =>
        t("admin.grid.footerPaginationDisplayedRows", {
          from,
          to,
          count: count === -1 ? `more than ${to}` : count,
        }),
    },
  };
}

function isAuditOnlyResource(resource) {
  return AUDIT_ONLY_TABLES.has(resource.table);
}

function getRowId(resource, row, index = 0) {
  return String(row?.[resource.primaryKey] ?? row?.id ?? `${resource.table}-${index}-${row?.created_at || row?.accepted_at || "row"}`);
}

function buildCsv(rows) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\n");
}

function downloadCsv(filename, rows) {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function withTradeOfferReviewFields(resource, payload) {
  return payload;
}

async function withItemModerationFields(resource, payload, formState, supabase, t) {
  if (resource.table !== "items") {
    return payload;
  }

  if (formState.moderation_status === "accepted") {
    return {
      ...payload,
      accepted: true,
      review_reason_id: null,
      admin_moderated_at: new Date().toISOString(),
    };
  }

  if (formState.moderation_status === "rejected") {
    const selectedReasonCode = formState.review_reason_code;

    if (!selectedReasonCode) {
      throw new Error(t("admin.messages.reviewReasonRequired"));
    }

    const { data: reviewReason, error: reviewReasonError } = await supabase
      .from("item_review_reasons")
      .select("id")
      .eq("code", selectedReasonCode)
      .maybeSingle();

    if (reviewReasonError) {
      throw reviewReasonError;
    }

    if (!reviewReason?.id) {
      throw new Error(t("admin.messages.reviewReasonNotFound", { code: selectedReasonCode }));
    }

    return {
      ...payload,
      accepted: false,
      review_reason_id: reviewReason.id,
      admin_moderated_at: new Date().toISOString(),
    };
  }

  return {
    ...payload,
    accepted: null,
    review_reason_id: null,
  };
}

async function normalizePayload(resource, payload, formState, supabase, t) {
  const withTradeOfferFields = withTradeOfferReviewFields(resource, payload, formState);
  return withItemModerationFields(resource, withTradeOfferFields, formState, supabase, t);
}

function prunePayloadToExistingColumns(record, payload) {
  if (!record || !payload || typeof payload !== "object") {
    return payload;
  }

  return Object.fromEntries(Object.entries(payload).filter(([key]) => key in record));
}

function ensureMutationTouchedRows(data, operationLabel) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${operationLabel} did not affect any rows. This usually means a Row Level Security policy is blocking the action.`);
  }
}

function getValueTone(value) {
  const normalized = String(value || "").toLowerCase();

  if (["accepted", "approved", "resolved", "active", "completed", "true", "verified"].includes(normalized)) {
    return "success";
  }

  if (["pending", "reviewing", "warned"].includes(normalized)) {
    return "warning";
  }

  if (["rejected", "cancelled", "dismissed", "blocked", "suspended", "banned", "false", "deleted"].includes(normalized)) {
    return "error";
  }

  return "default";
}

function StatusChip({ value }) {
  const { t } = useTranslation();
  const tone = getValueTone(value);
  const colorMap = {
    success: "success",
    warning: "warning",
    error: "error",
    default: "default",
  };

  return <Chip size="small" color={colorMap[tone]} label={getOptionLabel(t, value)} variant={tone === "default" ? "outlined" : "filled"} />;
}

function CellPreview({ resource, column, row }) {
  const { t } = useTranslation();
  const value = getModerationDisplayValue(resource, column, row);

  if (column === "item_images_preview" && Array.isArray(value) && value.length > 0) {
    return (
      <Stack direction="row" spacing={1}>
        {value.slice(0, 3).map((image, index) => (
          <Box
            key={`${row.id || row.item_id || "image"}-${index}`}
            component="img"
            src={image.image_url}
            alt={t("admin.messages.imagePreviewAlt", { index: index + 1 })}
            sx={{ width: 44, height: 44, borderRadius: 2, objectFit: "cover", border: "1px solid", borderColor: "divider" }}
          />
        ))}
      </Stack>
    );
  }

  if (typeof value === "boolean") {
    return <StatusChip value={value ? "true" : "false"} />;
  }

  if (typeof value === "string" && isProbablyImageUrl(value)) {
    return (
      <Box
        component="img"
        src={value}
        alt={column}
        sx={{ width: 52, height: 52, borderRadius: 2, objectFit: "cover", border: "1px solid", borderColor: "divider" }}
      />
    );
  }

  if (typeof value === "string" && ["status", "moderation_status", "reason"].includes(column)) {
    return <StatusChip value={value} />;
  }

  return (
    <Typography
      variant="body2"
      sx={{
        whiteSpace: typeof value === "string" && value.includes("\n") ? "pre-wrap" : "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
      }}
    >
      {formatValue(resource, column, row)}
    </Typography>
  );
}

function FormField({ resource, fieldName, fieldConfig, value, onChange, readOnly, required }) {
  const { t } = useTranslation();
  const label = getFieldLabel(t, resource, fieldName);
  const options = fieldConfig.options || (fieldName === "review_reason_code" ? ITEM_REVIEW_REASON_CODES : []);

  if (fieldConfig.type === "boolean") {
    return (
      <TextField
        select
        fullWidth
        size="small"
        label={label}
        value={value ? "true" : "false"}
        onChange={(event) => onChange(event.target.value === "true")}
        disabled={readOnly}
      >
        <MenuItem value="true">{t("admin.options.true")}</MenuItem>
        <MenuItem value="false">{t("admin.options.false")}</MenuItem>
      </TextField>
    );
  }

  if (fieldConfig.type === "select") {
    return (
      <TextField
        select
        fullWidth
        size="small"
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={readOnly}
        required={required}
      >
        <MenuItem value="">{t("admin.form.select")}</MenuItem>
        {options.map((option) => (
          <MenuItem key={String(option.value || option)} value={typeof option === "string" ? option : option.value}>
            {typeof option === "string" ? getOptionLabel(t, option) : option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  const multiline = fieldConfig.type === "textarea" || fieldConfig.type === "json";

  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      multiline={multiline}
      minRows={multiline ? (fieldConfig.type === "json" ? 6 : 4) : undefined}
      type={multiline ? "text" : fieldConfig.type || "text"}
      InputProps={{ readOnly }}
      required={required}
      step={fieldConfig.step}
    />
  );
}

function PanelDrawer({ open, title, subtitle, onClose, children }) {
  const { i18n, t } = useTranslation();

  return (
    <Drawer anchor={i18n.language === "ar" ? "left" : "right"} open={open} onClose={onClose}>
      <Box sx={{ width: { xs: "100vw", sm: 620 }, maxWidth: "100vw", height: "100%", bgcolor: "background.paper" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3, pb: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              {subtitle}
            </Typography>
            <Typography variant="h5">{title}</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label={t("admin.actions.close")}>
            <Menu size={18} />
          </IconButton>
        </Stack>
        <Divider />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Drawer>
  );
}

function ResourceFormDrawer({ open, resource, mode, record, onClose, onSubmit, busy, supabase }) {
  const { t } = useTranslation();
  const [formState, setFormState] = useState(() => buildInitialForm(resource, record));
  const [error, setError] = useState("");
  const resourceLabel = getResourceLabel(t, resource);
  const isViewMode = mode === "view";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = {};

      Object.entries(resource.fields).forEach(([fieldName, fieldConfig]) => {
        if (fieldConfig.readOnly || isViewMode || !isFieldVisible(fieldConfig, formState) || fieldConfig.virtual) {
          return;
        }

        if (isFieldRequired(fieldConfig, formState) && formState[fieldName] === "") {
          throw new Error(t("admin.messages.requiredField", { field: getFieldLabel(t, resource, fieldName) }));
        }

        payload[fieldName] = parseInputValue(formState[fieldName], fieldConfig.type);
      });

      await onSubmit(payload, formState);
    } catch (submitError) {
      setError(submitError.message || t("admin.messages.saveError"));
    }
  }

  return (
    <PanelDrawer
      open={open}
      title={
        mode === "create"
          ? t("admin.drawer.addTitle", { resource: resourceLabel })
          : mode === "edit"
            ? t("admin.drawer.editTitle", { resource: resourceLabel })
            : t("admin.drawer.viewTitle", { resource: resourceLabel })
      }
      subtitle={resource.table}
      onClose={onClose}
    >
      <Stack spacing={3} component="form" onSubmit={handleSubmit}>
        {error ? <Chip color="error" label={error} sx={{ justifyContent: "flex-start", height: "auto", "& .MuiChip-label": { py: 1 } }} /> : null}

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {Object.entries(resource.fields).map(([fieldName, fieldConfig]) => {
            if (!isFieldVisible(fieldConfig, formState)) {
              return null;
            }

            return (
              <Box key={fieldName} sx={{ gridColumn: fieldConfig.type === "textarea" || fieldConfig.type === "json" ? "1 / -1" : "auto" }}>
                <FormField
                  resource={resource}
                  fieldName={fieldName}
                  fieldConfig={fieldConfig}
                  value={formState[fieldName]}
                  onChange={(nextValue) => setFormState((current) => ({ ...current, [fieldName]: nextValue }))}
                  readOnly={fieldConfig.readOnly || isViewMode}
                  required={isFieldRequired(fieldConfig, formState)}
                  supabase={supabase}
                />
              </Box>
            );
          })}
        </Box>

        {!isViewMode ? (
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="outlined" onClick={onClose}>
              {t("admin.actions.cancel")}
            </Button>
            <Button variant="contained" type="submit" disabled={busy}>
              {busy ? t("admin.actions.saving") : t("admin.actions.save")}
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </PanelDrawer>
  );
}

function PasswordResetDrawer({ open, record, onClose, onSubmit, busy }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("admin.messages.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("admin.messages.passwordMismatch"));
      return;
    }

    try {
      await onSubmit(password);
    } catch (submitError) {
      setError(submitError.message || t("admin.messages.passwordResetError"));
    }
  }

  return (
    <PanelDrawer open={open} title={t("admin.drawer.resetPasswordTitle")} subtitle={record?.username || record?.full_name || record?.id || ""} onClose={onClose}>
      <Stack spacing={3} component="form" onSubmit={handleSubmit}>
        {error ? <Chip color="error" label={error} sx={{ justifyContent: "flex-start", height: "auto", "& .MuiChip-label": { py: 1 } }} /> : null}
        <TextField fullWidth size="small" label={t("admin.fields.password")} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <TextField
          fullWidth
          size="small"
          label={t("admin.fields.confirm_password")}
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            {t("admin.actions.cancel")}
          </Button>
          <Button variant="contained" type="submit" disabled={busy}>
            {busy ? t("admin.actions.saving") : t("admin.actions.resetPassword")}
          </Button>
        </Stack>
      </Stack>
    </PanelDrawer>
  );
}

function hasMessageThread(resource) {
  return ["matches", "match_messages", "trade_offers", "offer_messages"].includes(resource.table);
}

async function loadConversation(resource, row, supabase) {
  const isMatchConversation = ["matches", "match_messages"].includes(resource.table);
  const messageTable = isMatchConversation ? "match_messages" : "offer_messages";
  const foreignKey = isMatchConversation ? "match_id" : "offer_id";
  const conversationId = resource.table === "matches" || resource.table === "trade_offers" ? row.id : row[foreignKey];

  const { data, error } = await supabase
    .from(messageTable)
    .select("id, sender_id, message, created_at, is_read")
    .eq(foreignKey, conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const profilesById = await loadProfilesMap(
    supabase,
    uniqueValues((data || []).map((entry) => entry.sender_id))
  );

  return {
    title: row.conversation_participants || `${resource.label} ${conversationId}`,
    subtitle: `${messageTable} / ${conversationId}`,
    messages: (data || []).map((entry) => ({
      ...entry,
      sender_name: getProfileName(profilesById[entry.sender_id], entry.sender_id),
      sender_avatar_url: profilesById[entry.sender_id]?.avatar_url || "",
    })),
  };
}

function ConversationDrawer({ open, title, subtitle, messages, loading, error, onClose }) {
  const { t } = useTranslation();

  return (
    <PanelDrawer open={open} title={title || t("admin.actions.messages")} subtitle={subtitle || t("admin.conversation.subtitleFallback")} onClose={onClose}>
      <Stack spacing={2}>
        {loading ? <Typography color="text.secondary">{t("admin.conversation.loading")}</Typography> : null}
        {error ? <Chip color="error" label={error} sx={{ justifyContent: "flex-start", height: "auto", "& .MuiChip-label": { py: 1 } }} /> : null}
        {!loading && !error && messages.length === 0 ? <Typography color="text.secondary">{t("admin.conversation.empty")}</Typography> : null}
        {!loading &&
          !error &&
          messages.map((message) => (
            <Stack
              key={message.id}
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              sx={{ justifyContent: "flex-start" }}
            >
              <Avatar src={message.sender_avatar_url} alt={message.sender_name}>
                {message.sender_name?.[0] || t("admin.conversation.unknownInitial")}
              </Avatar>
              <Box
                sx={{
                  maxWidth: "85%",
                  px: 2,
                  py: 1.5,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: "1px solid",
                  borderColor: alpha(theme.palette.primary.main, 0.16),
                }}
              >
                <Typography variant="subtitle2">{message.sender_name}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                  {message.message}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {formatDateTimeValue(message.created_at)}
                </Typography>
              </Box>
            </Stack>
          ))}
      </Stack>
    </PanelDrawer>
  );
}

function SummaryCard({ title, value, hint, icon: Icon, tone = "primary" }) {
  const toneMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(toneMap[tone], 0.16)}, ${alpha("#ffffff", 0.72)})`,
        border: "1px solid",
        borderColor: alpha(toneMap[tone], 0.2),
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {hint}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(toneMap[tone], 0.12),
              color: toneMap[tone],
            }}
          >
            <Icon size={20} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function OverviewPanel({ supabase, onOpenResource }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState(() => Date.now());
  const [snapshot, setSnapshot] = useState({
    items: [],
    reports: [],
    offers: [],
    profiles: [],
    matches: [],
  });

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [itemsResult, reportsResult, offersResult, profilesResult, matchesResult] = await Promise.all([
        supabase.from("items").select("id, title, accepted, status, created_at"),
        supabase.from("reports").select("id, status, reason, created_at, details"),
        supabase.from("trade_offers").select("id, status, created_at"),
        supabase.from("profiles").select("id, full_name, username, is_admin, created_at, moderation_status"),
        supabase.from("matches").select("id, status, updated_at"),
      ]);

      for (const result of [itemsResult, reportsResult, offersResult, profilesResult, matchesResult]) {
        if (result.error) {
          throw result.error;
        }
      }

      setSnapshot({
        items: itemsResult.data || [],
        reports: reportsResult.data || [],
        offers: offersResult.data || [],
        profiles: profilesResult.data || [],
        matches: matchesResult.data || [],
      });
      setGeneratedAt(Date.now());
    } catch (loadError) {
      setError(loadError.message || t("admin.overview.messages.loadError"));
    } finally {
      setLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSnapshot();
    });
  }, [loadSnapshot]);

  const now = generatedAt;
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const newItems = snapshot.items.filter((item) => new Date(item.created_at).getTime() >= weekAgo).length;
  const pendingItems = snapshot.items.filter((item) => item.accepted == null && item.status !== "deleted").length;
  const rejectedItems = snapshot.items.filter((item) => item.accepted === false).length;
  const openReports = snapshot.reports.filter((report) => ["open", "reviewing"].includes(report.status)).length;
  const overdueReports = snapshot.reports.filter((report) => ["open", "reviewing"].includes(report.status) && new Date(report.created_at).getTime() < dayAgo).length;
  const pendingOffers = snapshot.offers.filter((offer) => offer.status === "pending").length;
  const newUsers = snapshot.profiles.filter((profile) => new Date(profile.created_at).getTime() >= weekAgo).length;
  const activeMatches = snapshot.matches.filter((match) => match.status === "active").length;

  const recentReports = [...snapshot.reports]
    .sort((a, b) => compareValues(b.created_at, a.created_at))
    .slice(0, 5);

  const recentItems = [...snapshot.items]
    .sort((a, b) => compareValues(b.created_at, a.created_at))
    .slice(0, 5);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {t("admin.overview.eyebrow")}
          </Typography>
          <Typography variant="h4">{t("admin.overview.title")}</Typography>
          <Typography color="text.secondary">{t("admin.overview.text")}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadSnapshot}>
          {t("admin.actions.refresh")}
        </Button>
      </Stack>

      {error ? <Chip color="error" label={error} sx={{ justifyContent: "flex-start", height: "auto", "& .MuiChip-label": { py: 1 } }} /> : null}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" } }}>
        <SummaryCard title={t("admin.overview.cards.newItems.title")} value={newItems} hint={t("admin.overview.cards.newItems.hint")} icon={GalleryHorizontal} />
        <SummaryCard title={t("admin.overview.cards.pendingItems.title")} value={pendingItems} hint={t("admin.overview.cards.pendingItems.hint")} icon={ShieldAlert} tone="warning" />
        <SummaryCard title={t("admin.overview.cards.openReports.title")} value={openReports} hint={t("admin.overview.cards.openReports.hint", { count: overdueReports })} icon={AlertTriangle} tone="error" />
        <SummaryCard title={t("admin.overview.cards.pendingOffers.title")} value={pendingOffers} hint={t("admin.overview.cards.pendingOffers.hint")} icon={ClipboardList} tone="secondary" />
        <SummaryCard title={t("admin.overview.cards.rejectedItems.title")} value={rejectedItems} hint={t("admin.overview.cards.rejectedItems.hint")} icon={Ban} tone="error" />
        <SummaryCard title={t("admin.overview.cards.newUsers.title")} value={newUsers} hint={t("admin.overview.cards.newUsers.hint")} icon={User} tone="success" />
        <SummaryCard title={t("admin.overview.cards.activeMatches.title")} value={activeMatches} hint={t("admin.overview.cards.activeMatches.hint")} icon={MessageSquare} tone="primary" />
        <SummaryCard
          title={t("admin.overview.cards.adminAccounts.title")}
          value={snapshot.profiles.filter((profile) => profile.is_admin).length}
          hint={t("admin.overview.cards.adminAccounts.hint", { count: snapshot.profiles.length })}
          icon={ShieldCheck}
          tone="success"
        />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "1.2fr 1fr" } }}>
        <Paper sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">{t("admin.overview.recentReports.title")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("admin.overview.recentReports.text")}
              </Typography>
            </Box>
            <Button size="small" onClick={() => onOpenResource("reports")}>
              {t("admin.overview.recentReports.cta")}
            </Button>
          </Stack>
          <Stack spacing={1.5}>
            {loading ? <Typography color="text.secondary">{t("admin.messages.loading")}</Typography> : null}
            {!loading &&
              recentReports.map((report) => (
                <Paper key={report.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">{report.reason ? getOptionLabel(t, report.reason) : t("admin.messages.unknownReason")}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {report.details || t("admin.messages.noDetails")}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={1}>
                      <StatusChip value={report.status} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTimeValue(report.created_at)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">{t("admin.overview.recentItems.title")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("admin.overview.recentItems.text")}
              </Typography>
            </Box>
            <Button size="small" onClick={() => onOpenResource("items")}>
              {t("admin.overview.recentItems.cta")}
            </Button>
          </Stack>
          <Stack spacing={1.5}>
            {loading ? <Typography color="text.secondary">{t("admin.messages.loading")}</Typography> : null}
            {!loading &&
              recentItems.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">{item.title || item.id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTimeValue(item.created_at)}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={1}>
                      <StatusChip value={item.accepted == null ? "pending" : item.accepted ? "accepted" : "rejected"} />
                      <Chip size="small" variant="outlined" label={getOptionLabel(t, item.status || "unknown")} />
                    </Stack>
                  </Stack>
                </Paper>
              ))}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
}

function AdminResourcePanel({ resource, supabase, moderatorId }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewRecord, setViewRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [passwordResetRecord, setPasswordResetRecord] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [conversationState, setConversationState] = useState({ title: "", subtitle: "", messages: [] });

  const resourceLabel = getResourceLabel(t, resource);
  const visibleColumns = useMemo(() => getColumnList(resource, rows), [resource, rows]);
  const gridLocaleText = useMemo(() => getGridLocaleText(t), [t]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let query = supabase.from(resource.table).select("*");

      if (resource.table === "items") {
        query = query.neq("status", "deleted");
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      let nextRows = data || [];

      if (resource.table === "items" && nextRows.length > 0) {
        const itemIds = nextRows.map((row) => row.id).filter(Boolean);
        const { data: imageRows, error: imageError } = await supabase
          .from("item_images")
          .select("item_id, image_url, sort_order, is_main")
          .in("item_id", itemIds)
          .order("is_main", { ascending: false })
          .order("sort_order", { ascending: true });

        if (imageError) {
          throw imageError;
        }

        const imagesByItemId = groupRowsBy(imageRows || [], "item_id");
        nextRows = nextRows.map((row) => ({
          ...row,
          item_images_preview: imagesByItemId[row.id] || [],
        }));
      }

      nextRows = await enrichAdminRows(resource, nextRows, supabase);
      setRows(nextRows);
    } catch (loadError) {
      setRows([]);
      setError(loadError.message || t("admin.messages.loadError", { resource: resourceLabel }));
    } finally {
      setLoading(false);
    }
  }, [resource, resourceLabel, supabase, t]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRows();
    });
  }, [loadRows]);

  async function handleCreate(payload, formState) {
    setBusy(true);
    setError("");

    try {
      const normalizedPayload = await normalizePayload(resource, payload, formState, supabase, t);
      const nextPayload =
        resource.table === "profiles" && normalizedPayload.moderation_status
          ? { ...normalizedPayload, moderated_at: new Date().toISOString(), moderated_by: moderatorId || null }
          : resource.table === "items" && (normalizedPayload.accepted != null || normalizedPayload.status)
            ? { ...normalizedPayload, admin_moderated_by: moderatorId || null }
            : normalizedPayload;

      const { data: insertedRows, error: insertError } = await supabase
        .from(resource.table)
        .insert(nextPayload)
        .select(resource.primaryKey);

      if (insertError) {
        throw insertError;
      }

      ensureMutationTouchedRows(insertedRows, `Creating ${resourceLabel}`);

      setIsCreating(false);
      await loadRows();
    } catch (createError) {
      setError(createError.message || t("admin.messages.createError", { resource: resourceLabel }));
      throw createError;
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(payload, formState) {
    setBusy(true);
    setError("");

    try {
      const normalizedPayload = await normalizePayload(resource, payload, formState, supabase, t);
      const basePayload =
        resource.table === "profiles" && normalizedPayload.moderation_status
          ? { ...normalizedPayload, moderated_at: new Date().toISOString(), moderated_by: moderatorId || null }
          : resource.table === "items" && (normalizedPayload.accepted != null || normalizedPayload.status)
            ? { ...normalizedPayload, admin_moderated_at: new Date().toISOString(), admin_moderated_by: moderatorId || null }
            : normalizedPayload;
      const nextPayload = prunePayloadToExistingColumns(editingRecord, basePayload);

      const { data: updatedRows, error: updateError } = await supabase
        .from(resource.table)
        .update(nextPayload)
        .eq(resource.primaryKey, editingRecord[resource.primaryKey])
        .select(resource.primaryKey);

      if (updateError) {
        throw updateError;
      }

      ensureMutationTouchedRows(updatedRows, `Updating ${resourceLabel}`);

      setEditingRecord(null);
      await loadRows();
    } catch (updateError) {
      setError(updateError.message || t("admin.messages.updateError", { resource: resourceLabel }));
      throw updateError;
    } finally {
      setBusy(false);
    }
  }

  const handleDelete = useCallback(async (record) => {
    if (isAuditOnlyResource(resource)) {
      setError(t("admin.messages.auditDeleteDisabled"));
      return;
    }

    if (!window.confirm(t("admin.messages.deleteConfirm", { resource: resourceLabel, id: record[resource.primaryKey] }))) {
      return;
    }

    setBusy(true);

    try {
      if (resource.table === "items") {
        const softDeletePayload = prunePayloadToExistingColumns(record, {
          status: "deleted",
          accepted: false,
        });
        const { data: updatedRows, error: deleteError } = await supabase
          .from(resource.table)
          .update(softDeletePayload)
          .eq(resource.primaryKey, record[resource.primaryKey])
          .select(resource.primaryKey);

        if (deleteError) {
          throw deleteError;
        }

        ensureMutationTouchedRows(updatedRows, `Deleting ${resourceLabel}`);
      } else {
        const { data: deletedRows, error: deleteError } = await supabase
          .from(resource.table)
          .delete()
          .eq(resource.primaryKey, record[resource.primaryKey])
          .select(resource.primaryKey);

        if (deleteError) {
          throw deleteError;
        }

        ensureMutationTouchedRows(deletedRows, `Deleting ${resourceLabel}`);
      }

      await loadRows();
    } catch (deleteError) {
      setError(deleteError.message || t("admin.messages.deleteError", { resource: resourceLabel }));
    } finally {
      setBusy(false);
    }
  }, [loadRows, resource, resourceLabel, supabase, t]);

  async function handlePasswordReset(nextPassword) {
    if (!passwordResetRecord?.id) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { error: resetError } = await supabase.functions.invoke("admin-reset-password", {
        body: { userId: passwordResetRecord.id, password: nextPassword },
      });

      if (resetError) {
        throw resetError;
      }

      window.alert(t("admin.messages.passwordResetSuccess"));
      setPasswordResetRecord(null);
    } finally {
      setBusy(false);
    }
  }

  const handleOpenConversation = useCallback(async (row) => {
    setConversationOpen(true);
    setConversationLoading(true);
    setConversationError("");

    try {
      const nextConversation = await loadConversation(resource, row, supabase);
      setConversationState(nextConversation);
    } catch (loadError) {
      setConversationState({ title: "", subtitle: "", messages: [] });
      setConversationError(loadError.message || t("admin.conversation.loadError"));
    } finally {
      setConversationLoading(false);
    }
  }, [resource, supabase, t]);

  const columns = useMemo(() => {
    const baseColumns = visibleColumns.map((column) => ({
      field: column,
      headerName: getFieldLabel(t, resource, column),
      minWidth: ["message", "description", "conversation_thread", "resolution_notes", "admin_moderation_notes", "admin_review_notes", "details"].includes(column)
        ? 240
        : 160,
      flex: ["message", "description", "conversation_thread", "resolution_notes", "admin_moderation_notes", "admin_review_notes", "details"].includes(column)
        ? 1.5
        : 1,
      sortable: true,
      filterable: true,
      valueGetter: (_value, row) => formatValue(resource, column, row),
      sortComparator: (left, right) => compareValues(left, right),
      renderCell: (params) => <CellPreview resource={resource} column={column} row={params.row} />,
    }));

    baseColumns.push({
      field: "__actions__",
      headerName: t("admin.panel.actionsHeader"),
      minWidth: 170,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const row = params.row;
        const isAuditTable = isAuditOnlyResource(resource);

        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={t("admin.actions.view")}>
              <IconButton size="small" onClick={() => setViewRecord(row)}>
                <Eye size={16} />
              </IconButton>
            </Tooltip>
            {!isAuditTable ? (
              <Tooltip title={t("admin.actions.edit")}>
                <IconButton size="small" onClick={() => setEditingRecord(row)}>
                  <Pencil size={16} />
                </IconButton>
              </Tooltip>
            ) : null}
            {hasMessageThread(resource) ? (
              <Tooltip title={t("admin.actions.messages")}>
                <IconButton size="small" onClick={() => void handleOpenConversation(row)}>
                  <MessageCircleMore size={16} />
                </IconButton>
              </Tooltip>
            ) : null}
            {resource.table === "profiles" ? (
              <Tooltip title={t("admin.actions.resetPassword")}>
                <IconButton size="small" onClick={() => setPasswordResetRecord(row)}>
                  <KeyRound size={16} />
                </IconButton>
              </Tooltip>
            ) : null}
            {!isAuditTable ? (
              <Tooltip title={t("admin.actions.delete")}>
                <IconButton size="small" color="error" disabled={busy} onClick={() => void handleDelete(row)}>
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        );
      },
    });

    return baseColumns;
  }, [busy, handleDelete, handleOpenConversation, resource, t, visibleColumns]);

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {resource.table}
            </Typography>
            <Typography variant="h5">{resourceLabel}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("admin.panel.meta")}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadCsv(`${resource.table}.csv`, rows)}>
              {t("admin.actions.exportCsv")}
            </Button>
            <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={() => void loadRows()}>
              {t("admin.actions.refresh")}
            </Button>
            {!isAuditOnlyResource(resource) ? (
              <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setIsCreating(true)}>
                {t("admin.actions.add")}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      {error ? <Chip color="error" label={error} sx={{ justifyContent: "flex-start", height: "auto", "& .MuiChip-label": { py: 1 } }} /> : null}

      <Paper sx={{ p: 1.5 }}>
        <Box sx={{ height: { xs: 560, lg: "calc(100vh - 280px)" }, minHeight: 520, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row, index) => getRowId(resource, row, index)}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
              sorting: {
                sortModel: resource.defaultSort?.column
                  ? [{ field: resource.defaultSort.column, sort: resource.defaultSort.ascending ? "asc" : "desc" }]
                  : [],
              },
            }}
            slots={{ toolbar: GridToolbar }}
            localeText={gridLocaleText}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 300 },
                csvOptions: { disableToolbarButton: true },
                printOptions: { disableToolbarButton: true },
              },
            }}
            sx={{
              border: 0,
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                borderRadius: 2,
              },
              "& .MuiDataGrid-cell": {
                alignItems: "center",
              },
            }}
          />
        </Box>
      </Paper>

      {isCreating ? (
        <ResourceFormDrawer
          key={`${resource.table}-create`}
          open={isCreating}
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
          key={`${resource.table}-edit-${getRowId(resource, editingRecord)}`}
          open={Boolean(editingRecord)}
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
          key={`${resource.table}-view-${getRowId(resource, viewRecord)}`}
          open={Boolean(viewRecord)}
          resource={resource}
          mode="view"
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          onSubmit={async () => {}}
          busy={false}
          supabase={supabase}
        />
      ) : null}

      {passwordResetRecord ? (
        <PasswordResetDrawer
          key={`password-reset-${passwordResetRecord.id}`}
          open={Boolean(passwordResetRecord)}
          record={passwordResetRecord}
          onClose={() => setPasswordResetRecord(null)}
          onSubmit={handlePasswordReset}
          busy={busy}
        />
      ) : null}

      {conversationOpen ? (
        <ConversationDrawer
          open={conversationOpen}
          title={conversationState.title}
          subtitle={conversationState.subtitle}
          messages={conversationState.messages}
          loading={conversationLoading}
          error={conversationError}
          onClose={() => {
            setConversationOpen(false);
            setConversationError("");
            setConversationState({ title: "", subtitle: "", messages: [] });
          }}
        />
      ) : null}
    </Stack>
  );
}

function DownloadIcon() {
  return <Columns3 size={16} />;
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { profile, signOut, supabase } = useAdminAuth();
  const [activeView, setActiveView] = useState(OVERVIEW_VIEW);
  const [signOutError, setSignOutError] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isRtl = i18n.language === "ar";

  useEffect(() => {
    document.title = `${t("admin.dashboard.pageTitle", { defaultValue: "Admin Dashboard" })} | SawaSwap`;
  }, [t]);

  const activeResource = adminResources.find((resource) => resource.table === activeView) || adminResources[0];

  const navContent = (
    <Stack
      sx={{
        width: { xs: 320, lg: 300 },
        minHeight: { xs: "100%", lg: "calc(100vh - 32px)" },
        height: "100%",
        p: 0,
        gap: 0,
        bgcolor: "background.paper",
        borderRadius: 0,
        borderRight: isRtl ? "none" : `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        borderLeft: isRtl ? `1px solid ${alpha(theme.palette.primary.main, 0.08)}` : "none",
      }}
    >
      <Paper
        sx={{
          p: 2,
          borderRadius: 0,
          boxShadow: "none",
          background: `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.secondary.main, 0.12)})`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              color: "primary.main",
            }}
          >
            <ShieldCheck size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {t("admin.dashboard.brand")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile?.full_name || profile?.username || profile?.id || t("admin.messages.unknownUser")}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ flex: 1, minHeight: 0, overflow: "auto", borderRadius: 0, boxShadow: "none" }}>
        {isMobile ? (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}` }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              {t("admin.nav.title")}
            </Typography>
            <IconButton onClick={() => setNavOpen(false)} aria-label={t("admin.nav.closeMenu")}>
              <Menu size={18} />
            </IconButton>
          </Stack>
        ) : null}
        <List sx={{ p: 1 }}>
          <ListItemButton
            selected={activeView === OVERVIEW_VIEW}
            onClick={() => {
              setActiveView(OVERVIEW_VIEW);
              setNavOpen(false);
            }}
            sx={{ borderRadius: 0, mb: 0.5 }}
          >
            <BarChart3 size={16} />
            <ListItemText primary={t("admin.nav.dashboard")} secondary={t("admin.nav.dashboardMeta")} sx={{ ml: 1.5 }} />
          </ListItemButton>

          {adminResources.map((resource) => {
            const Icon = getTableIcon(resource);
            return (
              <ListItemButton
                key={resource.table}
                selected={resource.table === activeView}
                onClick={() => {
                  setActiveView(resource.table);
                  setNavOpen(false);
                }}
                sx={{ borderRadius: 0, mb: 0.5 }}
              >
                <Icon size={16} />
                <ListItemText primary={getResourceLabel(t, resource)} secondary={resource.table} sx={{ ml: 1.5 }} />
              </ListItemButton>
            );
          })}
        </List>
      </Paper>

      {signOutError ? <Chip color="error" label={signOutError} sx={{ justifyContent: "flex-start", height: "auto", "& .MuiChip-label": { py: 1 } }} /> : null}

      <Button
        variant="outlined"
        color="inherit"
        startIcon={<LogOut size={16} />}
        sx={{ m: 2, borderRadius: 0 }}
        onClick={async () => {
          setSignOutError("");
          try {
            await signOut();
          } catch (error) {
            setSignOutError(error.message || t("admin.messages.signOutError"));
          }
        }}
      >
        {t("admin.actions.signOut")}
      </Button>
    </Stack>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <TopBar />

        <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", lg: "300px minmax(0, 1fr)" },
              alignItems: "start",
            }}
          >
            {!isMobile ? (
              <Box
                sx={{
                  position: "sticky",
                  top: 0,
                  alignSelf: "stretch",
                  minHeight: "100vh",
                }}
              >
                {navContent}
              </Box>
            ) : null}

            <Stack spacing={2}>
              <Paper
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 5,
                  background: `radial-gradient(circle at top left, ${alpha(theme.palette.secondary.main, 0.18)}, transparent 38%), linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${theme.palette.primary.dark})`,
                  color: "#f7f7f3",
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: alpha("#fff", 0.72) }}>
                      {t("admin.dashboard.heroEyebrow")}
                    </Typography>
                    <Typography variant="h3" sx={{ mt: 1, maxWidth: 720 }}>
                      {t("admin.dashboard.heroTitle")}
                    </Typography>
                    <Typography sx={{ mt: 1.5, maxWidth: 760, color: alpha("#fff", 0.86) }}>
                      {t("admin.dashboard.heroText")}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    {isMobile ? (
                      <IconButton
                        onClick={() => setNavOpen(true)}
                        aria-label={t("admin.nav.openMenu")}
                        sx={{
                          bgcolor: alpha("#fff", 0.14),
                          color: "#fff",
                          "&:hover": { bgcolor: alpha("#fff", 0.22) },
                        }}
                      >
                        <Menu size={18} />
                      </IconButton>
                    ) : null}
                    <Badge color="secondary" badgeContent={activeView === OVERVIEW_VIEW ? t("admin.dashboard.liveBadge") : t("admin.dashboard.tableBadge")}>
                      <Chip label={activeView === OVERVIEW_VIEW ? t("admin.nav.dashboard") : getResourceLabel(t, activeResource) || t("admin.dashboard.tableFallback")} sx={{ bgcolor: alpha("#fff", 0.14), color: "#fff" }} />
                    </Badge>
                  </Stack>
                </Stack>
              </Paper>

              {activeView === OVERVIEW_VIEW ? (
                <OverviewPanel supabase={supabase} onOpenResource={setActiveView} />
              ) : (
                <AdminResourcePanel key={activeResource.table} resource={activeResource} supabase={supabase} moderatorId={profile?.id} />
              )}
            </Stack>
          </Box>
        </Box>

        <Drawer
          anchor={isRtl ? "right" : "left"}
          open={navOpen}
          onClose={() => setNavOpen(false)}
          PaperProps={{
            sx: {
              width: 320,
              maxWidth: "100vw",
              height: "100vh",
              borderRadius: 0,
            },
          }}
        >
          {navContent}
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}
