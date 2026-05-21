import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Columns3,
  FileImage,
  FileJson,
  FileSearch,
  Filter,
  Eye,
  Funnel,
  GalleryHorizontal,
  Hash,
  Heart,
  IdCard,
  Image,
  Languages,
  LayoutGrid,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  ScanSearch,
  SearchCheck,
  Send,
  Pencil,
  Phone,
  Plus,
  ScrollText,
  RefreshCw,
  Search,
  Shield,
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

  const knownImageHosts = [
    "googleusercontent.com",
    "ggpht.com",
    "gravatar.com",
    "cloudinary.com",
    "supabase.co",
  ];

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

      return "";
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
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("id, title, owner_id")
    .in("id", itemIds);

  if (itemsError) {
    throw itemsError;
  }

  const itemsById = Object.fromEntries((items || []).map((itemRow) => [itemRow.id, itemRow]));
  const userIds = uniqueValues(
    rows.flatMap((row) => [row.user_id, itemsById[row.item_id]?.owner_id])
  );
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

const DEFAULT_TABLE_ICON = LayoutGrid;
const DEFAULT_FIELD_ICON = Columns3;

const TABLE_ICONS = {
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
  trade_offers: ClipboardList,
  user_push_tokens: Bookmark,
};

const FIELD_ICONS = {
  accepted: CheckCircle2,
  accepted_at: CalendarClock,
  action: ScanSearch,
  admin_review_notes: ScrollText,
  admin_review_status: Shield,
  admin_reviewed_at: CalendarClock,
  area: MapPin,
  avatar_url: Image,
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
  moderation_status: Shield,
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
  review_reason_code: FileSearch,
  review_reason_id: FileSearch,
  sender_id: Send,
  sender_avatar_url: Image,
  sender_name: User,
  slug: Tag,
  sort_order: SlidersHorizontal,
  status: CheckCircle2,
  storage_path: FileImage,
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

    return rows.filter((row) =>
      visibleColumns.some((column) => formatValue(resource, column, row).toLowerCase().includes(query))
    );
  }, [resource, rows, searchTerm, visibleColumns]);
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((leftRow, rightRow) => {
      const leftValue = getModerationDisplayValue(resource, sortColumn, leftRow);
      const rightValue = getModerationDisplayValue(resource, sortColumn, rightRow);
      const comparison = compareValues(leftValue, rightValue);
      return sortAscending ? comparison : comparison * -1;
    });
  }, [filteredRows, resource, sortAscending, sortColumn]);

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
      const normalizedPayload = await normalizePayload(resource, payload, formState, supabase);
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

  async function handlePasswordReset(nextPassword) {
    if (!passwordResetRecord?.id) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { error: resetError } = await supabase.functions.invoke("admin-reset-password", {
        body: {
          userId: passwordResetRecord.id,
          password: nextPassword,
        },
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
                  <tr key={row[resource.primaryKey]}>
                    {visibleColumns.map((column) => (
                      <td key={column}>
                        <CellContent resource={resource} column={column} row={row} />
                      </td>
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
            {adminResources.map((resource) => (
              <button
                key={resource.table}
                className={resource.table === activeTable ? "adminNavItem active" : "adminNavItem"}
                type="button"
                onClick={() => setActiveTable(resource.table)}
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

          <AdminResourcePanel key={activeResource.table} resource={activeResource} supabase={supabase} />
        </section>
      </main>
    </div>
  );
}
