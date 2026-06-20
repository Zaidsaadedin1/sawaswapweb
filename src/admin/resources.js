const TIMESTAMP_FIELD = { type: "datetime-local" };
const UUID_FIELD = { type: "text" };
const ITEM_REVIEW_REASON_CODES = [
  "missing_details",
  "inappropriate_content",
  "prohibited_item",
  "duplicate_listing",
  "spam",
  "other",
];

function baseFields(fields) {
  return {
    created_at: { ...TIMESTAMP_FIELD, readOnly: true },
    updated_at: { ...TIMESTAMP_FIELD, readOnly: true },
    ...fields,
  };
}

export const adminResources = [
  {
    table: "blocked_users",
    label: "Blocked Users",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    fields: {
      id: { ...UUID_FIELD, readOnly: true },
      blocker_id: { type: "text", required: true },
      blocked_user_id: { type: "text", required: true },
      reason: { type: "textarea" },
      created_at: { ...TIMESTAMP_FIELD, readOnly: true },
    },
  },
  {
    table: "categories",
    label: "Categories",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      name_en: { type: "text", required: true },
      name_ar: { type: "text", required: true },
      icon: { type: "text" },
      is_active: { type: "boolean" },
    }),
  },
  {
    table: "favorites",
    label: "Favorites",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      user_id: { type: "text", required: true },
      item_id: { type: "text", required: true },
    }),
  },
  {
    table: "filter_seed",
    label: "Filter Seed",
    primaryKey: "path",
    defaultSort: { column: "sort_order", ascending: true },
    fields: {
      path: { type: "text", required: true },
      parent_path: { type: "text" },
      slug: { type: "text" },
      name_en: { type: "text" },
      name_ar: { type: "text" },
      level: { type: "number" },
      sort_order: { type: "number" },
    },
  },
  {
    table: "item_filters",
    label: "Item Filters",
    primaryKey: "id",
    defaultSort: { column: "sort_order", ascending: true },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      parent_id: { type: "text" },
      path: { type: "text", required: true },
      slug: { type: "text", required: true },
      name_en: { type: "text", required: true },
      name_ar: { type: "text", required: true },
      level: { type: "number", required: true },
      sort_order: { type: "number" },
      is_active: { type: "boolean" },
    }),
  },
  {
    table: "item_images",
    label: "Item Images",
    primaryKey: "id",
    defaultSort: { column: "sort_order", ascending: true },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      item_id: { type: "text", required: true },
      image_url: { type: "text", required: true },
      storage_path: { type: "text" },
      sort_order: { type: "number" },
      is_main: { type: "boolean" },
    }),
  },
  {
    table: "items",
    label: "Items",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    fields: baseFields({
      item_images_preview: { type: "image-list", readOnly: true, hideInForm: true, virtual: true },
      id: { ...UUID_FIELD, readOnly: true },
      owner_id: { type: "text", required: true },
      category_id: { type: "text" },
      title: { type: "text", required: true },
      description: { type: "textarea" },
      condition: {
        type: "select",
        options: ["new", "like_new", "good", "used", "damaged"],
        required: true,
      },
      status: {
        type: "select",
        options: ["active", "reserved", "traded", "hidden", "deleted"],
        required: true,
      },
      city: { type: "text" },
      area: { type: "text" },
      wants_description: { type: "textarea" },
      accepts_cash_difference: { type: "boolean" },
      estimated_value: { type: "number", step: "0.01" },
      currency: { type: "text" },
      views_count: { type: "number" },
      offers_count: { type: "number" },
      filter_id: { type: "text" },
      offer_type: {
        type: "select",
        options: ["trade", "sell", "buy", "free"],
        required: true,
      },
      admin_moderation_notes: { type: "textarea" },
      admin_moderated_at: { type: "datetime-local", readOnly: true },
      admin_moderated_by: { type: "text", readOnly: true },
      moderation_status: {
        type: "select",
        options: ["accepted", "rejected"],
        required: true,
        getInitialValue: (record) => {
          if (record?.accepted === true) {
            return "accepted";
          }

          if (record?.accepted === false) {
            return "rejected";
          }

          return "";
        },
        virtual: true,
      },
      accepted: { type: "boolean", readOnly: true, hideInForm: true },
      review_reason_id: { type: "text", readOnly: true, hideInForm: true },
      review_reason_code: {
        type: "select",
        options: ITEM_REVIEW_REASON_CODES,
        getInitialValue: () => "",
        virtual: true,
        showWhen: (formState) => formState.moderation_status === "rejected",
        requiredWhen: (formState) => formState.moderation_status === "rejected",
      },
    }),
  },
  {
    table: "match_messages",
    label: "Match Messages",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      match_id: { type: "text", required: true },
      sender_id: { type: "text", required: true },
      message: { type: "textarea", required: true },
      is_read: { type: "boolean" },
    }),
  },
  {
    table: "matches",
    label: "Matches",
    primaryKey: "id",
    defaultSort: { column: "updated_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      item_id: { type: "text", required: true },
      owner_id: { type: "text", required: true },
      interested_user_id: { type: "text", required: true },
      offer_id: { type: "text" },
      status: {
        type: "select",
        options: ["active", "closed", "blocked"],
        required: true,
      },
    }),
  },
  {
    table: "notifications",
    label: "Notifications",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      user_id: { type: "text", required: true },
      title: { type: "text", required: true },
      body: { type: "textarea" },
      type: { type: "text" },
      data: { type: "json" },
      is_read: { type: "boolean" },
    }),
  },
  {
    table: "offer_messages",
    label: "Offer Messages",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      offer_id: { type: "text", required: true },
      sender_id: { type: "text", required: true },
      message: { type: "textarea", required: true },
      is_read: { type: "boolean" },
    }),
  },
  {
    table: "profiles",
    label: "Profiles",
    primaryKey: "id",
    defaultSort: { column: "updated_at", ascending: false },
    fields: baseFields({
      id: { type: "text", required: true },
      full_name: { type: "text" },
      username: { type: "text" },
      avatar_url: { type: "text" },
      phone: { type: "text" },
      city: { type: "text" },
      rating: { type: "number", step: "0.1" },
      total_trades: { type: "number" },
      is_verified: { type: "boolean" },
      is_admin: { type: "boolean" },
      moderation_status: {
        type: "select",
        options: ["active", "warned", "suspended", "banned"],
      },
      moderation_note: { type: "textarea" },
      moderated_at: { type: "datetime-local", readOnly: true },
      moderated_by: { type: "text", readOnly: true },
    }),
  },
  {
    table: "reports",
    label: "Reports",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      reporter_id: { type: "text", required: true },
      item_id: { type: "text" },
      reported_user_id: { type: "text" },
      reason: {
        type: "select",
        options: ["spam", "fake_item", "offensive_content", "scam", "harassment", "illegal_item", "other"],
        required: true,
      },
      details: { type: "textarea" },
      status: {
        type: "select",
        options: ["open", "reviewing", "resolved", "dismissed"],
        required: true,
      },
      source: { type: "text" },
      reviewed_at: { type: "datetime-local", readOnly: true },
      resolution_notes: { type: "textarea" },
      moderator_id: { type: "text", readOnly: true },
    }),
  },
  {
    table: "swipes",
    label: "Swipes",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      user_id: { type: "text", required: true },
      item_id: { type: "text", required: true },
      action: {
        type: "select",
        options: ["skip", "make_offer", "removed"],
        required: true,
      },
    }),
  },
  {
    table: "terms_acceptance",
    label: "Terms Acceptance",
    primaryKey: "id",
    defaultSort: { column: "accepted_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      user_id: { type: "text", required: true },
      terms_version: { type: "text", required: true },
      accepted_at: { type: "datetime-local", required: true },
      source: { type: "text" },
    }),
  },
  {
    table: "trade_offers",
    label: "Trade Offers",
    primaryKey: "id",
    defaultSort: { column: "updated_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      requester_id: { type: "text", required: true },
      owner_id: { type: "text", required: true },
      requested_item_id: { type: "text", required: true },
      offered_item_id: { type: "text" },
      cash_difference_amount: { type: "number", step: "0.01" },
      currency: { type: "text" },
      message: { type: "textarea" },
      status: {
        type: "select",
        options: ["pending", "accepted", "rejected", "cancelled", "completed"],
        required: true,
      },
      accepted_at: { type: "datetime-local" },
      completed_at: { type: "datetime-local" },
    }),
  },
  {
    table: "user_push_tokens",
    label: "User Push Tokens",
    primaryKey: "id",
    defaultSort: { column: "updated_at", ascending: false },
    fields: baseFields({
      id: { ...UUID_FIELD, readOnly: true },
      user_id: { type: "text", required: true },
      token: { type: "textarea", required: true },
      platform: { type: "text", required: true },
    }),
  },
];

export const adminResourceMap = Object.fromEntries(
  adminResources.map((resource) => [resource.table, resource])
);
