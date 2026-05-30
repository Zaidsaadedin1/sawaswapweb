import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Ban,
  Bell,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Columns3,
  Download,
  Eye,
  FileImage,
  FileJson,
  FileSearch,
  Filter,
  Funnel,
  GalleryHorizontal,
  Hash,
  Heart,
  IdCard,
  Image,
  KeyRound,
  Languages,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  ScanSearch,
  ScrollText,
  Search,
  SearchCheck,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Tag,
  ToggleLeft,
  Trash2,
  User,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { adminResources } from "../admin/resources";
import TopBar from "../components/TopBar";
import { useAdminAuth } from "../context/useAdminAuth";

const MODERATION_VIEW = "__moderation__";
const REPORT_PRIORITY = {
  illegal_item: 4,
  harassment: 3,
  offensive_content: 2,
  scam: 1,
};
const AUDIT_ONLY_TABLES = new Set(["blocked_users", "terms_acceptance"]);
const ITEM_REVIEW_REASON_MAP = {
  fake_item: "spam",
  offensive_content: "inappropriate_content",
  scam: "spam",
  harassment: "inappropriate_content",
  illegal_item: "prohibited_item",
  other: "other",
};

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
    month: "2-digit",
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

  if (!/^https?:\/\//.test(trimmedValue)) {
    return false;
  }

  const knownImageHosts = ["googleusercontent.com", "ggpht.com", "gravatar.com", "cloudinary.com", "supabase.co"];

  try {
    const parsedUrl = new URL(trimmedValue);
    if (knownImageHosts.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))) {
      return true;
    }
  } catch {
    return false;
  }

  return (
    /(image|avatar|photo)/.test(trimmedValue) ||
    /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/.test(trimmedValue)
  );
}

function mapTradeOfferModerationStatus(value) {
  if (value === "approved") {
    return "accepted";
  }

  if (value === "cancelled") {
    return "rejected";
  }

  return value;
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

      return row.moderation_status || "";
    }

    if (resource.table === "trade_offers") {
      return mapTradeOfferModerationStatus(row.admin_review_status);
    }
  }

  if (resource.table === "trade_offers" && column === "admin_review_status") {
    return mapTradeOfferModerationStatus(row.admin_review_status);
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

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url")
    .in("id", nextUserIds);

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
      ? supabase
          .from("match_messages")
          .select("id, match_id, sender_id, message, created_at")
          .in("match_id", matchIds)
          .order("created_at", { ascending: true })
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
      owner_avatar_url: ownerProfile?.avatar_url || "",
      interested_user_name: getProfileName(interestedProfile, row.interested_user_id),
      interested_user_avatar_url: interestedProfile?.avatar_url || "",
      conversation_participants: `${getProfileName(ownerProfile, row.owner_id)} <-> ${getProfileName(
        interestedProfile,
        row.interested_user_id
      )}`,
      conversation_thread: buildConversationThread(messagesByMatchId[row.id], profilesById),
    };
  });
}

async function enrichMatchMessageRows(rows, supabase) {
  const matchIds = uniqueValues(rows.map((row) => row.match_id));
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, owner_id, interested_user_id")
    .in("id", matchIds);

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
      ? supabase
          .from("match_messages")
          .select("id, match_id, sender_id, message, created_at")
          .in("match_id", matchIds)
          .order("created_at", { ascending: true })
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
      sender_avatar_url: senderProfile?.avatar_url || "",
      owner_name: getProfileName(ownerProfile, matchRow?.owner_id),
      interested_user_name: getProfileName(interestedProfile, matchRow?.interested_user_id),
      conversation_participants: `${getProfileName(ownerProfile, matchRow?.owner_id)} <-> ${getProfileName(
        interestedProfile,
        matchRow?.interested_user_id
      )}`,
      conversation_thread: buildConversationThread(messagesByMatchId[row.match_id], profilesById),
    };
  });
}

async function enrichOfferMessageRows(rows, supabase) {
  const offerIds = uniqueValues(rows.map((row) => row.offer_id));
  const { data: offers, error: offersError } = await supabase
    .from("trade_offers")
    .select("id, requester_id, owner_id")
    .in("id", offerIds);

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
      ? supabase
          .from("offer_messages")
          .select("id, offer_id, sender_id, message, created_at")
          .in("offer_id", offerIds)
          .order("created_at", { ascending: true })
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
      sender_avatar_url: senderProfile?.avatar_url || "",
      requester_name: getProfileName(requesterProfile, offerRow?.requester_id),
      owner_name: getProfileName(ownerProfile, offerRow?.owner_id),
      conversation_participants: `${getProfileName(requesterProfile, offerRow?.requester_id)} <-> ${getProfileName(
        ownerProfile,
        offerRow?.owner_id
      )}`,
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

  return rows.map((row) => {
    const userProfile = profilesById[row.user_id];
    const itemRow = itemsById[row.item_id];
    const ownerProfile = profilesById[itemRow?.owner_id];

    return {
      ...row,
      user_name: getProfileName(userProfile, row.user_id),
      user_avatar_url: userProfile?.avatar_url || "",
      item_title: itemRow?.title || row.item_id,
      item_owner_name: getProfileName(ownerProfile, itemRow?.owner_id),
      item_owner_avatar_url: ownerProfile?.avatar_url || "",
    };
  });
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

function CellContent({ resource, column, row }) {
  const value = getModerationDisplayValue(resource, column, row);

  if (column === "item_images_preview" && Array.isArray(value) && value.length > 0) {
    return (
      <div className="adminImageStack">
        {value.map((image, index) => (
          <a
            key={`${row.id || row.item_id || "image"}-${index}`}
            className="adminImageThumbLink"
            href={image.image_url}
            target="_blank"
            rel="noreferrer"
          >
            <img className="adminImageThumb" src={image.image_url} alt={`Item ${index + 1}`} loading="lazy" />
          </a>
        ))}
      </div>
    );
  }

  if (typeof value === "string" && isProbablyImageUrl(value)) {
    return (
      <a className="adminImageThumbLink" href={value} target="_blank" rel="noreferrer">
        <img className="adminImageThumb" src={value} alt={column} loading="lazy" />
      </a>
    );
  }

  if (typeof value === "string" && value.includes("\n")) {
    return <div className="adminMultilineCell">{value}</div>;
  }

  return formatValue(resource, column, row);
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
    defaultValue: t(`admin.fields.${fieldName}`, { defaultValue: fieldName.replaceAll("_", " ") }),
  });
}

function isAuditOnlyResource(resource) {
  return AUDIT_ONLY_TABLES.has(resource.table);
}

function isReportOverdue(report) {
  if (!report?.created_at) {
    return false;
  }

  if (!["open", "reviewing"].includes(report.status)) {
    return false;
  }

  return Date.now() - new Date(report.created_at).getTime() > 24 * 60 * 60 * 1000;
}

function formatRelativeSla(report) {
  if (!report?.created_at) {
    return "No timestamp";
  }

  const hours = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
  return `${Math.max(hours, 0).toFixed(1)}h since report`;
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

function appendModerationNote(existingValue, moderatorName, nextLine) {
  const prefix = `[${new Date().toISOString()}] ${moderatorName}`;
  return [existingValue, `${prefix}: ${nextLine}`].filter(Boolean).join("\n");
}

function buildModerationNotification(action, report) {
  const notificationsByAction = {
    warn: {
      title: "Account warning",
      body: "Your account received a warning from SawaSwap moderation. Review your recent activity and follow the platform rules.",
    },
    suspend: {
      title: "Account suspended",
      body: "Your account has been suspended by SawaSwap moderation while we review a safety issue.",
    },
    ban: {
      title: "Account banned",
      body: "Your account has been banned by SawaSwap moderation due to a safety or policy violation.",
    },
    reactivate: {
      title: "Account reactivated",
      body: "Your account has been reactivated by SawaSwap moderation. You can continue using the platform.",
    },
  };

  const content = notificationsByAction[action];

  if (!content) {
    return null;
  }

  return {
    ...content,
    type: "admin_moderation",
    data: {
      action,
      report_id: report.id,
      reason: report.reason || null,
      item_id: report.item_id || null,
    },
  };
}

const DEFAULT_TABLE_ICON = LayoutGrid;
const DEFAULT_FIELD_ICON = Columns3;

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
  reports: Shield,
  swipes: ScanSearch,
  terms_acceptance: ScrollText,
  trade_offers: ClipboardList,
  user_push_tokens: Bookmark,
};

const FIELD_ICONS = {
  accepted: CheckCircle2,
  accepted_at: CalendarClock,
  action: ScanSearch,
  admin_moderated_at: CalendarClock,
  admin_moderated_by: ShieldCheck,
  admin_moderation_notes: ScrollText,
  admin_review_notes: ScrollText,
  admin_review_status: Shield,
  admin_reviewed_at: CalendarClock,
  area: MapPin,
  avatar_url: Image,
  blocked_user_id: Ban,
  blocker_id: User,
  body: ScrollText,
  cash_difference_amount: CircleDollarSign,
  category_id: Tag,
  city: MapPin,
  completed_at: CalendarClock,
  condition: SearchCheck,
  confirm_password: KeyRound,
  created_at: CalendarClock,
  currency: CircleDollarSign,
  data: FileJson,
  description: ScrollText,
  details: FileSearch,
  email: Mail,
  estimated_value: CircleDollarSign,
  filter_id: Filter,
  full_name: User,
  icon: Star,
  id: Hash,
  image_url: Image,
  interested_user_id: User,
  is_active: ToggleLeft,
  is_admin: ShieldCheck,
  is_main: Image,
  is_read: Bell,
  is_verified: UserCheck,
  item_id: GalleryHorizontal,
  item_images_preview: FileImage,
  level: Columns3,
  match_id: Users,
  message: MessageSquare,
  moderated_at: CalendarClock,
  moderated_by: ShieldCheck,
  moderation_note: ScrollText,
  moderation_status: Shield,
  moderator_id: ShieldCheck,
  name_ar: Languages,
  name_en: Languages,
  offer_id: ClipboardList,
  offer_type: ClipboardList,
  offers_count: ClipboardList,
  offered_item_id: GalleryHorizontal,
  owner_id: User,
  owner_avatar_url: Image,
  owner_name: User,
  parent_id: Columns3,
  parent_path: Columns3,
  password: KeyRound,
  path: Columns3,
  phone: Phone,
  platform: Bookmark,
  rating: Star,
  reason: FileSearch,
  reported_user_id: User,
  reporter_id: User,
  requestor_id: User,
  requested_item_id: GalleryHorizontal,
  requester_id: User,
  requester_name: User,
  resolution_notes: ScrollText,
  review_reason_code: FileSearch,
  review_reason_id: FileSearch,
  reviewed_at: CalendarClock,
  sender_id: Send,
  sender_avatar_url: Image,
  sender_name: User,
  slug: Tag,
  sort_order: SlidersHorizontal,
  source: Bookmark,
  status: CheckCircle2,
  storage_path: FileImage,
  terms_version: ScrollText,
  title: ScrollText,
  token: Bookmark,
  total_trades: Users,
  type: Columns3,
  updated_at: CalendarClock,
  user_id: User,
  user_avatar_url: Image,
  user_name: User,
  username: IdCard,
  views_count: Eye,
  wants_description: ScrollText,
  conversation_participants: Users,
  conversation_thread: MessageSquare,
  interested_user_avatar_url: Image,
  interested_user_name: User,
  item_owner_avatar_url: Image,
  item_owner_name: User,
  item_title: ScrollText,
};

function getTableIcon(resource) {
  return TABLE_ICONS[resource.table] || DEFAULT_TABLE_ICON;
}

function getFieldIcon(fieldName) {
  return FIELD_ICONS[fieldName] || DEFAULT_FIELD_ICON;
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

function PasswordResetDrawer({ record, onClose, onSubmit, busy }) {
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
    <DrawerShell
      title={t("admin.drawer.resetPasswordTitle")}
      subtitle={record.username || record.full_name || record.id}
      onClose={onClose}
    >
      {error ? <div className="adminAlert adminAlertError">{error}</div> : null}

      <form className="adminFormGrid" onSubmit={handleSubmit}>
        <label className="adminField">
          <span>{t("admin.fields.password")}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("admin.fields.password")}
            required
            minLength={8}
          />
        </label>

        <label className="adminField">
          <span>{t("admin.fields.confirm_password")}</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={t("admin.fields.confirm_password")}
            required
            minLength={8}
          />
        </label>

        <div className="adminModalActions">
          <button className="adminSecondaryBtn" type="button" onClick={onClose}>
            {t("admin.actions.cancel")}
          </button>
          <button className="adminPrimaryBtn" type="submit" disabled={busy}>
            {busy ? t("admin.actions.saving") : t("admin.actions.resetPassword")}
          </button>
        </div>
      </form>
    </DrawerShell>
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
    setFormState((current) => ({ ...current, [fieldName]: nextValue }));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSelectOptions() {
      const fieldsWithRemoteOptions = Object.entries(resource.fields).filter(([, fieldConfig]) => fieldConfig.optionsSource);

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
            (data || []).map((row) => (mapOption ? mapOption(row) : { value: row.id, label: row.name || row.id })),
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
              <span className="adminFieldLabel">
                {createElement(getFieldIcon(fieldName), { size: 14 })}
                {getFieldLabel(t, resource, fieldName)}
              </span>

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
                      {typeof option === "string" ? t(`admin.options.${option}`, { defaultValue: option }) : option.label}
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

function withTradeOfferReviewFields(resource, payload, formState) {
  if (resource.table !== "trade_offers") {
    return payload;
  }

  const nextAdminReviewStatus =
    formState.moderation_status === "accepted"
      ? "approved"
      : formState.moderation_status === "rejected"
        ? "cancelled"
        : payload.admin_review_status;

  if (nextAdminReviewStatus === "approved" || nextAdminReviewStatus === "cancelled") {
    return {
      ...payload,
      admin_review_status: nextAdminReviewStatus,
      admin_reviewed_at: new Date().toISOString(),
    };
  }

  return {
    ...payload,
    admin_review_status: nextAdminReviewStatus,
    admin_reviewed_at: null,
  };
}

async function withItemModerationFields(resource, payload, formState, supabase) {
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
      throw new Error("Review reason is required.");
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
      throw new Error(`Review reason code "${selectedReasonCode}" was not found in item_review_reasons.`);
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

async function normalizePayload(resource, payload, formState, supabase) {
  const withTradeOfferFields = withTradeOfferReviewFields(resource, payload, formState);
  return withItemModerationFields(resource, withTradeOfferFields, formState, supabase);
}

function AdminResourcePanel({ resource, supabase, moderatorId }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortColumn, setSortColumn] = useState(resource.defaultSort.column);
  const [sortAscending, setSortAscending] = useState(resource.defaultSort.ascending);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewRecord, setViewRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [passwordResetRecord, setPasswordResetRecord] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const resourceLabel = getResourceLabel(t, resource);

  const visibleColumns = useMemo(() => getColumnList(resource, rows), [resource, rows]);
  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => visibleColumns.some((column) => formatValue(resource, column, row).toLowerCase().includes(query)));
  }, [resource, rows, searchTerm, visibleColumns]);
  const sortedRows = useMemo(
    () =>
      [...filteredRows].sort((leftRow, rightRow) => {
        const leftValue = getModerationDisplayValue(resource, sortColumn, leftRow);
        const rightValue = getModerationDisplayValue(resource, sortColumn, rightRow);
        const comparison = compareValues(leftValue, rightValue);
        return sortAscending ? comparison : comparison * -1;
      }),
    [filteredRows, resource, sortAscending, sortColumn]
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase.from(resource.table).select("*");

    if (queryError) {
      setRows([]);
      setError(queryError.message || t("admin.messages.loadError", { resource: resourceLabel }));
      setLoading(false);
      return;
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
        setError(imageError.message || t("admin.messages.loadError", { resource: resourceLabel }));
      } else {
        const imagesByItemId = (imageRows || []).reduce((accumulator, imageRow) => {
          if (!accumulator[imageRow.item_id]) {
            accumulator[imageRow.item_id] = [];
          }

          accumulator[imageRow.item_id].push(imageRow);
          return accumulator;
        }, {});

        nextRows = nextRows.map((row) => ({
          ...row,
          item_images_preview: imagesByItemId[row.id] || [],
        }));
      }
    }

    nextRows = await enrichAdminRows(resource, nextRows, supabase);
    setRows(nextRows);
    setLoading(false);
  }, [resource, resourceLabel, supabase, t]);

  useEffect(() => {
    queueMicrotask(loadRows);
  }, [loadRows]);

  async function handleCreate(payload, formState) {
    setBusy(true);

    try {
      const normalizedPayload = await normalizePayload(resource, payload, formState, supabase);
      const nextPayload =
        resource.table === "profiles" && normalizedPayload.moderation_status
          ? { ...normalizedPayload, moderated_at: new Date().toISOString(), moderated_by: moderatorId || null }
          : resource.table === "items" && (normalizedPayload.accepted != null || normalizedPayload.status)
            ? { ...normalizedPayload, admin_moderated_by: moderatorId || null }
            : normalizedPayload;
      const { error: insertError } = await supabase.from(resource.table).insert(nextPayload);

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
      const normalizedPayload = await normalizePayload(resource, payload, formState, supabase);
      const nextPayload =
        resource.table === "profiles" && normalizedPayload.moderation_status
          ? { ...normalizedPayload, moderated_at: new Date().toISOString(), moderated_by: moderatorId || null }
          : resource.table === "items" && (normalizedPayload.accepted != null || normalizedPayload.status)
            ? { ...normalizedPayload, admin_moderated_at: new Date().toISOString(), admin_moderated_by: moderatorId || null }
            : normalizedPayload;
      const { error: updateError } = await supabase
        .from(resource.table)
        .update(nextPayload)
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
    if (isAuditOnlyResource(resource)) {
      setError("Delete is disabled for audit tables.");
      return;
    }

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
    } catch (passwordResetError) {
      setError(passwordResetError.message || t("admin.messages.passwordResetError"));
    } finally {
      setBusy(false);
    }
  }

  const isAuditTable = isAuditOnlyResource(resource);
  const canCreate = !isAuditTable;

  return (
    <section className="adminPanel">
      <div className="adminPanelHeader">
        <div>
          <p className="adminOverline">
            {createElement(getTableIcon(resource), { size: 14 })}
            {resource.table}
          </p>
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
              {visibleColumns.map((fieldName) => (
                <option key={fieldName} value={fieldName}>
                  {getFieldLabel(t, resource, fieldName)}
                </option>
              ))}
            </select>
            <select value={sortAscending ? "asc" : "desc"} onChange={(event) => setSortAscending(event.target.value === "asc")}>
              <option value="asc">{t("admin.panel.sortAsc")}</option>
              <option value="desc">{t("admin.panel.sortDesc")}</option>
            </select>
          </div>

          <button className="adminSecondaryBtn" type="button" onClick={loadRows}>
            <RefreshCw size={16} />
            {t("admin.actions.refresh")}
          </button>

          {canCreate ? (
            <button className="adminPrimaryBtn" type="button" onClick={() => setIsCreating(true)}>
              <Plus size={16} />
              {t("admin.actions.add")}
            </button>
          ) : null}
        </div>
      </div>

      <p className="adminResultsMeta">{t("admin.panel.results", { count: filteredRows.length, total: rows.length })}</p>

      {error ? <div className="adminAlert adminAlertError">{error}</div> : null}

      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column}
                  className="adminSortableHeader"
                  onClick={() => {
                    if (sortColumn === column) {
                      setSortAscending((current) => !current);
                      return;
                    }

                    setSortColumn(column);
                    setSortAscending(true);
                  }}
                >
                  <span className="adminHeaderLabel">
                    {createElement(getFieldIcon(column), { size: 14 })}
                    {getFieldLabel(t, resource, column)}
                  </span>
                </th>
              ))}
              <th>
                <span className="adminHeaderLabel">
                  <Columns3 size={14} />
                  {t("admin.panel.actionsHeader")}
                </span>
              </th>
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

            {!loading && sortedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="adminTableEmpty">
                  {searchTerm ? t("admin.messages.noSearchResults") : t("admin.messages.noRecords")}
                </td>
              </tr>
            ) : null}

            {!loading
              ? sortedRows.map((row) => (
                  <tr key={String(row[resource.primaryKey] ?? `${row.user_id}-${row.created_at}`)}>
                    {visibleColumns.map((column) => (
                      <td key={column}>
                        <CellContent resource={resource} column={column} row={row} />
                      </td>
                    ))}
                    <td>
                      <div className="adminRowActions">
                        <button className="adminIconBtn" type="button" onClick={() => setViewRecord(row)} title={t("admin.actions.view")}>
                          <Eye size={16} />
                        </button>
                        {!isAuditTable ? (
                          <button
                            className="adminIconBtn"
                            type="button"
                            onClick={() => setEditingRecord(row)}
                            title={t("admin.actions.edit")}
                          >
                            <Pencil size={16} />
                          </button>
                        ) : null}
                        {!isAuditTable ? (
                          <button
                            className="adminIconBtn adminDangerBtn"
                            type="button"
                            onClick={() => handleDelete(row)}
                            title={t("admin.actions.delete")}
                            disabled={busy}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                        {resource.table === "profiles" ? (
                          <button
                            className="adminIconBtn"
                            type="button"
                            onClick={() => setPasswordResetRecord(row)}
                            title={t("admin.actions.resetPassword")}
                            disabled={busy}
                          >
                            <KeyRound size={16} />
                          </button>
                        ) : null}
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
          key={`${resource.table}-view-${viewRecord[resource.primaryKey] || viewRecord.created_at || viewRecord.accepted_at}`}
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
          record={passwordResetRecord}
          onClose={() => setPasswordResetRecord(null)}
          onSubmit={handlePasswordReset}
          busy={busy}
        />
      ) : null}
    </section>
  );
}

function ModerationCard({ title, value, hint, tone = "default", icon: Icon }) {
  return (
    <article className={`adminMetricCard ${tone !== "default" ? `adminMetricCard-${tone}` : ""}`}>
      <div className="adminMetricIcon">{createElement(Icon, { size: 18 })}</div>
      <strong>{value}</strong>
      <span>{title}</span>
      <small>{hint}</small>
    </article>
  );
}

function ModerationSection({ title, meta, actions, children }) {
  return (
    <section className="adminPanel">
      <div className="adminPanelHeader">
        <div>
          <h2>{title}</h2>
          {meta ? <p className="adminPanelMeta">{meta}</p> : null}
        </div>
        {actions ? <div className="adminPanelActions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ModerationReportDrawer({
  report,
  item,
  itemImages,
  reporter,
  reportedUser,
  moderator,
  repeatedReportCount,
  reportsSubmitted,
  activeItemCount,
  blockCount,
  busy,
  onClose,
  onSaveResolution,
  onQuickReportStatus,
  onItemAction,
  onUserAction,
}) {
  const [status, setStatus] = useState(report.status || "open");
  const [notes, setNotes] = useState(report.resolution_notes || "");

  return (
    <DrawerShell title={`Report ${report.id}`} subtitle={report.reason || "Moderation"} onClose={onClose}>
      <div className="adminDetailGrid">
        <div className="adminDetailCard">
          <p className="adminOverline">Timeline</p>
          <div className="adminKeyValueList">
            <div><strong>Created</strong><span>{formatDateTimeValue(report.created_at)}</span></div>
            <div><strong>Status</strong><span>{report.status || "open"}</span></div>
            <div><strong>Reviewed</strong><span>{report.reviewed_at ? formatDateTimeValue(report.reviewed_at) : "—"}</span></div>
            <div><strong>SLA</strong><span className={isReportOverdue(report) ? "adminTextDanger" : ""}>{isReportOverdue(report) ? "Missed 24h target" : "Within target"}</span></div>
            <div><strong>Age</strong><span>{formatRelativeSla(report)}</span></div>
            <div><strong>Moderator</strong><span>{getProfileName(moderator, report.moderator_id)}</span></div>
          </div>
        </div>

        <div className="adminDetailCard">
          <p className="adminOverline">Details</p>
          <div className="adminKeyValueList">
            <div><strong>Source</strong><span>{report.source || "—"}</span></div>
            <div><strong>Item ID</strong><span>{report.item_id || "—"}</span></div>
            <div><strong>Reported user</strong><span>{getProfileName(reportedUser, report.reported_user_id)}</span></div>
            <div><strong>Reporter</strong><span>{getProfileName(reporter, report.reporter_id)}</span></div>
          </div>
          <div className="adminDetailBlock">
            <strong>Report notes</strong>
            <p>{report.details || "No extra detail provided."}</p>
          </div>
        </div>
      </div>

      <div className="adminDetailGrid">
        <div className="adminDetailCard">
          <p className="adminOverline">Reporter</p>
          <div className="adminProfileSummary">
            {reporter?.avatar_url ? <img src={reporter.avatar_url} alt={getProfileName(reporter)} className="adminAvatar" /> : null}
            <div>
              <strong>{getProfileName(reporter, report.reporter_id)}</strong>
              <span>{reporter?.city || "Unknown city"}</span>
              <small>{reportsSubmitted} reports submitted</small>
            </div>
          </div>
        </div>

        <div className="adminDetailCard">
          <p className="adminOverline">Reported User</p>
          <div className="adminProfileSummary">
            {reportedUser?.avatar_url ? (
              <img src={reportedUser.avatar_url} alt={getProfileName(reportedUser)} className="adminAvatar" />
            ) : null}
            <div>
              <strong>{getProfileName(reportedUser, report.reported_user_id)}</strong>
              <span>{reportedUser?.city || "Unknown city"}</span>
              <small>{repeatedReportCount} reports received • {activeItemCount} active items • {blockCount} block links</small>
              {reportedUser?.phone ? <small>{reportedUser.phone}</small> : null}
            </div>
          </div>
        </div>
      </div>

      {item ? (
        <div className="adminDetailCard">
          <p className="adminOverline">Item</p>
          <div className="adminKeyValueList">
            <div><strong>Title</strong><span>{item.title || "—"}</span></div>
            <div><strong>Status</strong><span>{item.status || "—"}</span></div>
            <div><strong>Accepted</strong><span>{item.accepted == null ? "—" : item.accepted ? "true" : "false"}</span></div>
            <div><strong>Review reason</strong><span>{item.review_reason_id || "—"}</span></div>
            <div><strong>Owner</strong><span>{getProfileName(reportedUser, item.owner_id)}</span></div>
            <div><strong>Location</strong><span>{[item.city, item.area].filter(Boolean).join(" / ") || "—"}</span></div>
            <div><strong>Category / filter</strong><span>{[item.category_id, item.filter_id].filter(Boolean).join(" / ") || "—"}</span></div>
          </div>
          <div className="adminDetailBlock">
            <strong>Description</strong>
            <p>{item.description || "No description."}</p>
          </div>
          {itemImages.length > 0 ? (
            <div className="adminImageStack">
              {itemImages.map((imageRow, index) => (
                <a key={`${imageRow.image_url}-${index}`} className="adminImageThumbLink" href={imageRow.image_url} target="_blank" rel="noreferrer">
                  <img className="adminImageThumb adminImageThumbLarge" src={imageRow.image_url} alt={`Item ${index + 1}`} />
                </a>
              ))}
            </div>
          ) : null}
          <div className="adminQuickActionGrid">
            <button className="adminPrimaryBtn" type="button" disabled={busy} onClick={() => onItemAction("approve", report, item)}>
              <CheckCircle2 size={16} />
              Approve item
            </button>
            <button className="adminSecondaryBtn" type="button" disabled={busy} onClick={() => onItemAction("hide", report, item)}>
              <Shield size={16} />
              Hide item
            </button>
            <button className="adminSecondaryBtn" type="button" disabled={busy} onClick={() => onItemAction("reject", report, item)}>
              <X size={16} />
              Reject item
            </button>
            <button className="adminSecondaryBtn" type="button" disabled={busy} onClick={() => onItemAction("remove", report, item)}>
              <Archive size={16} />
              Remove item
            </button>
          </div>
        </div>
      ) : null}

      <div className="adminDetailCard">
        <p className="adminOverline">User Actions</p>
        <div className="adminQuickActionGrid">
          <button className="adminSecondaryBtn" type="button" disabled={busy} onClick={() => onUserAction("warn", report)}>
            <AlertTriangle size={16} />
            Warn user
          </button>
          <button className="adminSecondaryBtn" type="button" disabled={busy} onClick={() => onUserAction("suspend", report)}>
            <ShieldAlert size={16} />
            Suspend user
          </button>
          <button className="adminSecondaryBtn" type="button" disabled={busy} onClick={() => onUserAction("ban", report)}>
            <Ban size={16} />
            Ban user
          </button>
          <button className="adminSecondaryBtn" type="button" disabled={busy} onClick={() => onUserAction("reactivate", report)}>
            <ShieldCheck size={16} />
            Reactivate user
          </button>
        </div>
      </div>

      <div className="adminDetailCard">
        <p className="adminOverline">Resolution</p>
        <div className="adminFormGrid">
          <label className="adminField">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="open">open</option>
              <option value="reviewing">reviewing</option>
              <option value="resolved">resolved</option>
              <option value="dismissed">dismissed</option>
            </select>
          </label>

          <label className="adminField">
            <span>Resolution notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} />
          </label>

          <div className="adminQuickActionGrid">
            <button className="adminSecondaryBtn" type="button" disabled={busy} onClick={() => onQuickReportStatus(report, "reviewing", notes)}>
              Mark reviewing
            </button>
            <button className="adminPrimaryBtn" type="button" disabled={busy} onClick={() => onQuickReportStatus(report, "resolved", notes)}>
              Resolve report
            </button>
            <button className="adminSecondaryBtn" type="button" disabled={busy} onClick={() => onQuickReportStatus(report, "dismissed", notes)}>
              Dismiss report
            </button>
            <button className="adminPrimaryBtn" type="button" disabled={busy} onClick={() => onSaveResolution(report, status, notes)}>
              Save resolution
            </button>
          </div>
        </div>
      </div>
    </DrawerShell>
  );
}

function ModerationWorkspace({ supabase, moderatorProfile }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  const [blockedRows, setBlockedRows] = useState([]);
  const [termsRows, setTermsRows] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [itemsById, setItemsById] = useState({});
  const [itemImagesByItemId, setItemImagesByItemId] = useState({});
  const [reportReasonIds, setReportReasonIds] = useState({});
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("newest");
  const [termsVersionFilter, setTermsVersionFilter] = useState("all");
  const [termsDateFrom, setTermsDateFrom] = useState("");
  const [termsDateTo, setTermsDateTo] = useState("");

  const loadModerationData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        reportsResult,
        blockedResult,
        termsResult,
        profilesResult,
        itemsResult,
        imagesResult,
        reasonResult,
      ] = await Promise.all([
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
        supabase.from("blocked_users").select("blocker_id, blocked_user_id, reason, created_at").order("created_at", { ascending: false }),
        supabase.from("terms_acceptance").select("user_id, terms_version, accepted_at, source").order("accepted_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, phone, city, created_at, moderation_status, moderation_note, moderated_at, moderated_by"),
        supabase
          .from("items")
          .select(
            "id, owner_id, category_id, title, description, status, city, area, filter_id, accepted, review_reason_id, admin_moderation_notes, admin_moderated_at, admin_moderated_by"
          ),
        supabase.from("item_images").select("item_id, image_url, sort_order, is_main").order("is_main", { ascending: false }).order("sort_order", { ascending: true }),
        supabase.from("item_review_reasons").select("id, code"),
      ]);

      for (const result of [reportsResult, blockedResult, termsResult, profilesResult, itemsResult, imagesResult]) {
        if (result.error) {
          throw result.error;
        }
      }

      setReports(reportsResult.data || []);
      setBlockedRows(blockedResult.data || []);
      setTermsRows(termsResult.data || []);
      setProfilesById(Object.fromEntries((profilesResult.data || []).map((row) => [row.id, row])));
      setItemsById(Object.fromEntries((itemsResult.data || []).map((row) => [row.id, row])));
      setItemImagesByItemId(groupRowsBy(imagesResult.data || [], "item_id"));
      setReportReasonIds(
        Object.fromEntries(
          ((reasonResult.error ? [] : reasonResult.data) || []).map((row) => [row.code, row.id])
        )
      );
    } catch (loadError) {
      setError(loadError.message || "Failed to load moderation data.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(loadModerationData);
  }, [loadModerationData]);

  const reportsByUser = useMemo(() => {
    const counts = {};
    reports.forEach((report) => {
      if (report.reported_user_id) {
        counts[report.reported_user_id] = (counts[report.reported_user_id] || 0) + 1;
      }
    });
    return counts;
  }, [reports]);

  const reportsSubmittedByUser = useMemo(() => {
    const counts = {};
    reports.forEach((report) => {
      if (report.reporter_id) {
        counts[report.reporter_id] = (counts[report.reporter_id] || 0) + 1;
      }
    });
    return counts;
  }, [reports]);

  const reportsByItem = useMemo(() => {
    const counts = {};
    reports.forEach((report) => {
      if (report.item_id) {
        counts[report.item_id] = (counts[report.item_id] || 0) + 1;
      }
    });
    return counts;
  }, [reports]);

  const activeItemsByUser = useMemo(() => {
    const counts = {};
    Object.values(itemsById).forEach((item) => {
      if (item.owner_id && item.status === "active") {
        counts[item.owner_id] = (counts[item.owner_id] || 0) + 1;
      }
    });
    return counts;
  }, [itemsById]);

  const blocksByUser = useMemo(() => {
    const counts = {};
    blockedRows.forEach((row) => {
      if (row.blocker_id) {
        counts[row.blocker_id] = (counts[row.blocker_id] || 0) + 1;
      }
      if (row.blocked_user_id) {
        counts[row.blocked_user_id] = (counts[row.blocked_user_id] || 0) + 1;
      }
    });
    return counts;
  }, [blockedRows]);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) {
        return false;
      }

      if (reasonFilter !== "all" && report.reason !== reasonFilter) {
        return false;
      }

      if (sourceFilter !== "all" && report.source !== sourceFilter) {
        return false;
      }

      if (priorityOnly && !REPORT_PRIORITY[report.reason]) {
        return false;
      }

      if (overdueOnly && !isReportOverdue(report)) {
        return false;
      }

      if (dateFrom && new Date(report.created_at) < new Date(`${dateFrom}T00:00:00`)) {
        return false;
      }

      if (dateTo && new Date(report.created_at) > new Date(`${dateTo}T23:59:59`)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [report.id, report.reporter_id, report.reported_user_id, report.item_id].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [dateFrom, dateTo, overdueOnly, priorityOnly, reasonFilter, reports, searchTerm, sourceFilter, statusFilter]);

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((left, right) => {
      if (sortMode === "oldest") {
        return compareValues(left.created_at, right.created_at);
      }

      if (sortMode === "oldest_unresolved") {
        const leftUnresolved = ["open", "reviewing"].includes(left.status) ? 0 : 1;
        const rightUnresolved = ["open", "reviewing"].includes(right.status) ? 0 : 1;
        if (leftUnresolved !== rightUnresolved) {
          return leftUnresolved - rightUnresolved;
        }
        return compareValues(left.created_at, right.created_at);
      }

      const priorityDelta = (REPORT_PRIORITY[right.reason] || 0) - (REPORT_PRIORITY[left.reason] || 0);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return compareValues(right.created_at, left.created_at);
    });
  }, [filteredReports, sortMode]);

  const moderationStats = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();

    return {
      open: reports.filter((report) => report.status === "open").length,
      reviewing: reports.filter((report) => report.status === "reviewing").length,
      overdue: reports.filter((report) => isReportOverdue(report)).length,
      resolvedToday: reports.filter((report) => {
        if (!report.reviewed_at || report.status !== "resolved") {
          return false;
        }

        const reviewed = new Date(report.reviewed_at);
        return reviewed.getFullYear() === yyyy && reviewed.getMonth() === mm && reviewed.getDate() === dd;
      }).length,
    };
  }, [reports]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) || null,
    [reports, selectedReportId]
  );

  const termVersions = useMemo(() => uniqueValues(termsRows.map((row) => row.terms_version)), [termsRows]);
  const filteredTerms = useMemo(
    () =>
      termsRows.filter((row) => {
        if (termsVersionFilter !== "all" && row.terms_version !== termsVersionFilter) {
          return false;
        }
        if (termsDateFrom && new Date(row.accepted_at) < new Date(`${termsDateFrom}T00:00:00`)) {
          return false;
        }
        if (termsDateTo && new Date(row.accepted_at) > new Date(`${termsDateTo}T23:59:59`)) {
          return false;
        }
        return true;
      }),
    [termsDateFrom, termsDateTo, termsRows, termsVersionFilter]
  );

  async function updateReport(reportId, patch) {
    const { data, error: updateError } = await supabase.from("reports").update(patch).eq("id", reportId).select("*");
    if (updateError) {
      throw updateError;
    }

    const nextRow = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!nextRow) {
      throw new Error("Report update was blocked or returned no row.");
    }

    setReports((current) =>
      current.map((report) => (report.id === reportId ? nextRow : report))
    );
    return nextRow;
  }

  async function updateItem(itemId, patch) {
    const { data, error: updateError } = await supabase.from("items").update(patch).eq("id", itemId).select("*");
    if (updateError) {
      throw updateError;
    }

    const nextRow = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!nextRow) {
      throw new Error("Item update was blocked or returned no row.");
    }

    setItemsById((current) => ({
      ...current,
      [itemId]: nextRow,
    }));
    return nextRow;
  }

  async function updateProfile(userId, patch) {
    const { data, error: updateError } = await supabase.from("profiles").update(patch).eq("id", userId).select("*");
    if (updateError) {
      throw updateError;
    }

    const nextRow = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!nextRow) {
      throw new Error("Profile update was blocked or returned no row.");
    }

    setProfilesById((current) => ({
      ...current,
      [userId]: nextRow,
    }));
    return nextRow;
  }

  async function handleSaveResolution(report, nextStatus, nextNotes) {
    setBusy(true);
    setError("");

    try {
      await updateReport(report.id, {
        status: nextStatus,
        resolution_notes: nextNotes || null,
        reviewed_at: ["reviewing", "resolved", "dismissed"].includes(nextStatus) ? new Date().toISOString() : report.reviewed_at,
        moderator_id: moderatorProfile?.id || null,
      });
    } catch (actionError) {
      setError(actionError.message || "Failed to update report.");
    } finally {
      setBusy(false);
    }
  }

  async function handleItemAction(action, report, item) {
    if (!item?.id) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const moderatorName = moderatorProfile?.full_name || moderatorProfile?.username || moderatorProfile?.id || "admin";
      const noteText = `${action} from report ${report.id}`;
      const basePatch = {
        admin_moderation_notes: appendModerationNote(item.admin_moderation_notes, moderatorName, noteText),
        admin_moderated_at: new Date().toISOString(),
        admin_moderated_by: moderatorProfile?.id || null,
      };

      if (action === "approve") {
        await updateItem(item.id, { ...basePatch, status: "active", accepted: true, review_reason_id: null });
      }

      if (action === "hide") {
        await updateItem(item.id, { ...basePatch, status: "hidden" });
      }

      if (action === "remove") {
        await updateItem(item.id, { ...basePatch, status: "deleted" });
      }

      if (action === "reject") {
        await updateItem(item.id, {
          ...basePatch,
          accepted: false,
          status: "hidden",
          review_reason_id: reportReasonIds[ITEM_REVIEW_REASON_MAP[report.reason]] || item.review_reason_id || null,
        });
      }
    } catch (actionError) {
      setError(actionError.message || "Failed to update item.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUserAction(action, report) {
    if (!report.reported_user_id) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const currentProfile = profilesById[report.reported_user_id];
      const moderatorName = moderatorProfile?.full_name || moderatorProfile?.username || moderatorProfile?.id || "admin";
      const statusMap = {
        warn: "warned",
        suspend: "suspended",
        ban: "banned",
        reactivate: "active",
      };

      await updateProfile(report.reported_user_id, {
        moderation_status: statusMap[action],
        moderation_note: appendModerationNote(currentProfile?.moderation_note, moderatorName, `${action} from report ${report.id}`),
        moderated_at: new Date().toISOString(),
        moderated_by: moderatorProfile?.id || null,
      });

      const notification = buildModerationNotification(action, report);

      if (notification) {
        const { error: notificationError } = await supabase.from("notifications").insert({
          user_id: report.reported_user_id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: notification.data,
          is_read: false,
        });

        if (notificationError) {
          throw notificationError;
        }
      }
    } catch (actionError) {
      setError(actionError.message || "Failed to update user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ModerationSection
        title="Moderation"
        meta="Review reports, enforce the 24-hour SLA, and persist item or account actions."
        actions={
          <>
            <button className="adminSecondaryBtn" type="button" onClick={loadModerationData}>
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              className="adminPrimaryBtn"
              type="button"
              onClick={() =>
                downloadCsv(
                  `reports-${new Date().toISOString().slice(0, 10)}.csv`,
                  sortedReports.map((report) => ({
                    id: report.id,
                    created_at: report.created_at,
                    status: report.status,
                    source: report.source,
                    reason: report.reason,
                    reporter_id: report.reporter_id,
                    reported_user_id: report.reported_user_id,
                    item_id: report.item_id,
                    reviewed_at: report.reviewed_at,
                    resolution_notes: report.resolution_notes,
                  }))
                )
              }
            >
              <Download size={16} />
              Export CSV
            </button>
          </>
        }
      >
        <div className="adminMetricGrid">
          <ModerationCard title="Open reports" value={moderationStats.open} hint="New queue" icon={Shield} />
          <ModerationCard title="Reviewing" value={moderationStats.reviewing} hint="In progress" icon={Clock3} />
          <ModerationCard title="Overdue" value={moderationStats.overdue} hint="Older than 24h" tone="danger" icon={AlertTriangle} />
          <ModerationCard title="Resolved today" value={moderationStats.resolvedToday} hint="Closed this calendar day" tone="success" icon={CheckCircle2} />
        </div>

        <div className="adminFilterGrid">
          <label className="adminField">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="open">open</option>
              <option value="reviewing">reviewing</option>
              <option value="resolved">resolved</option>
              <option value="dismissed">dismissed</option>
            </select>
          </label>

          <label className="adminField">
            <span>Reason</span>
            <select value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)}>
              <option value="all">All</option>
              {uniqueValues(reports.map((report) => report.reason)).map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>

          <label className="adminField">
            <span>Source</span>
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="all">All</option>
              {uniqueValues(reports.map((report) => report.source)).map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label className="adminField">
            <span>Date from</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label className="adminField">
            <span>Date to</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>

          <label className="adminField">
            <span>Sort</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="oldest_unresolved">Oldest unresolved first</option>
            </select>
          </label>

          <label className="adminSearchBox adminSearchBoxWide">
            <Search size={16} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search report, user, or item ID"
            />
          </label>

          <button className={`adminSecondaryBtn ${overdueOnly ? "isActive" : ""}`} type="button" onClick={() => setOverdueOnly((current) => !current)}>
            <AlertTriangle size={16} />
            Overdue only
          </button>

          <button className={`adminSecondaryBtn ${priorityOnly ? "isActive" : ""}`} type="button" onClick={() => setPriorityOnly((current) => !current)}>
            <ShieldAlert size={16} />
            Priority reasons
          </button>
        </div>

        <p className="adminResultsMeta">{sortedReports.length} shown out of {reports.length} reports</p>
        {error ? <div className="adminAlert adminAlertError">{error}</div> : null}

        <div className="adminTableWrap">
          <table className="adminTable adminModerationTable">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Created</th>
                <th>Status</th>
                <th>Source</th>
                <th>Reason</th>
                <th>Reporter</th>
                <th>Reported user</th>
                <th>Item ID</th>
                <th>Details</th>
                <th>Reviewed</th>
                <th>Counts</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="adminTableEmpty">Loading moderation queue...</td>
                </tr>
              ) : null}

              {!loading && sortedReports.length === 0 ? (
                <tr>
                  <td colSpan={12} className="adminTableEmpty">No reports match the current filters.</td>
                </tr>
              ) : null}

              {!loading
                ? sortedReports.map((report) => (
                    <tr
                      key={report.id}
                      className={[
                        isReportOverdue(report) ? "adminReportRowOverdue" : "",
                        REPORT_PRIORITY[report.reason] ? "adminReportRowPriority" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <td>{report.id}</td>
                      <td>{formatDateTimeValue(report.created_at)}</td>
                      <td>{report.status}</td>
                      <td>{report.source || "—"}</td>
                      <td>{report.reason}</td>
                      <td>{getProfileName(profilesById[report.reporter_id], report.reporter_id)}</td>
                      <td>{getProfileName(profilesById[report.reported_user_id], report.reported_user_id)}</td>
                      <td>{report.item_id || "—"}</td>
                      <td>{(report.details || "—").slice(0, 90)}</td>
                      <td>{report.reviewed_at ? formatDateTimeValue(report.reviewed_at) : "—"}</td>
                      <td>
                        {report.reported_user_id ? `${reportsByUser[report.reported_user_id] || 0} user` : "—"}
                        <br />
                        {report.item_id ? `${reportsByItem[report.item_id] || 0} item` : ""}
                      </td>
                      <td>
                        <button className="adminIconBtn" type="button" onClick={() => setSelectedReportId(report.id)} title="Open report">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </ModerationSection>

      <div className="adminSplitPanels">
        <ModerationSection title="Blocked Users" meta="Investigation view of user-side block relationships.">
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Blocker</th>
                  <th>Blocked</th>
                  <th>Reason</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {blockedRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="adminTableEmpty">No block relationships found.</td>
                  </tr>
                ) : (
                  blockedRows.slice(0, 200).map((row) => (
                    <tr key={`${row.blocker_id}-${row.blocked_user_id}-${row.created_at}`}>
                      <td>{row.blocker_id}</td>
                      <td>{row.blocked_user_id}</td>
                      <td>{row.reason || "—"}</td>
                      <td>{formatDateTimeValue(row.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ModerationSection>

        <ModerationSection
          title="Terms Acceptance"
          meta="Compliance audit view for accepted terms."
          actions={
            <>
              <label className="adminField">
                <span>Version</span>
                <select value={termsVersionFilter} onChange={(event) => setTermsVersionFilter(event.target.value)}>
                  <option value="all">All</option>
                  {termVersions.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adminField">
                <span>From</span>
                <input type="date" value={termsDateFrom} onChange={(event) => setTermsDateFrom(event.target.value)} />
              </label>
              <label className="adminField">
                <span>To</span>
                <input type="date" value={termsDateTo} onChange={(event) => setTermsDateTo(event.target.value)} />
              </label>
            </>
          }
        >
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Terms version</th>
                  <th>Accepted at</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredTerms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="adminTableEmpty">No matching terms acceptance rows.</td>
                  </tr>
                ) : (
                  filteredTerms.slice(0, 200).map((row) => (
                    <tr key={`${row.user_id}-${row.accepted_at}`}>
                      <td>{row.user_id}</td>
                      <td>{row.terms_version}</td>
                      <td>{formatDateTimeValue(row.accepted_at)}</td>
                      <td>{row.source || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ModerationSection>
      </div>

      {selectedReport ? (
        <ModerationReportDrawer
          key={selectedReport.id}
          report={selectedReport}
          item={itemsById[selectedReport.item_id]}
          itemImages={itemImagesByItemId[selectedReport.item_id] || []}
          reporter={profilesById[selectedReport.reporter_id]}
          reportedUser={profilesById[selectedReport.reported_user_id]}
          moderator={profilesById[selectedReport.moderator_id]}
          repeatedReportCount={reportsByUser[selectedReport.reported_user_id] || 0}
          reportsSubmitted={reportsSubmittedByUser[selectedReport.reporter_id] || 0}
          activeItemCount={activeItemsByUser[selectedReport.reported_user_id] || 0}
          blockCount={blocksByUser[selectedReport.reported_user_id] || 0}
          busy={busy}
          onClose={() => setSelectedReportId(null)}
          onSaveResolution={handleSaveResolution}
          onQuickReportStatus={handleSaveResolution}
          onItemAction={handleItemAction}
          onUserAction={handleUserAction}
        />
      ) : null}
    </>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { profile, signOut, supabase } = useAdminAuth();
  const [activeView, setActiveView] = useState(MODERATION_VIEW);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    document.title = `${t("admin.dashboard.pageTitle")} | SawaSwap`;
  }, [t]);

  const activeResource = adminResources.find((resource) => resource.table === activeView) || adminResources[0];

  async function handleSignOut() {
    setSignOutError("");

    try {
      await signOut();
    } catch (error) {
      setSignOutError(error.message || t("admin.messages.signOutError"));
    }
  }

  return (
    <div className="adminShellWithTopBar">
      <TopBar />

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
            <button
              className={activeView === MODERATION_VIEW ? "adminNavItem active" : "adminNavItem"}
              type="button"
              onClick={() => setActiveView(MODERATION_VIEW)}
            >
              <span className="adminNavLabel">
                <ShieldAlert size={16} />
                Moderation
              </span>
              <small>reports, SLA, actions</small>
            </button>

            {adminResources.map((resource) => (
              <button
                key={resource.table}
                className={resource.table === activeView ? "adminNavItem active" : "adminNavItem"}
                type="button"
                onClick={() => setActiveView(resource.table)}
              >
                <span className="adminNavLabel">
                  {createElement(getTableIcon(resource), { size: 16 })}
                  {getResourceLabel(t, resource)}
                </span>
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

          {activeView === MODERATION_VIEW ? (
            <ModerationWorkspace supabase={supabase} moderatorProfile={profile} />
          ) : (
            <AdminResourcePanel key={activeResource.table} resource={activeResource} supabase={supabase} moderatorId={profile?.id} />
          )}
        </section>
      </main>
    </div>
  );
}
