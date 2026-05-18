import { getSupabaseClient } from "./supabase";

const PUBLIC_ITEM_COLUMNS =
  "id, title, description, estimated_value, currency, status, offer_type, accepted, created_at";

function chooseMainImage(images) {
  if (!images.length) {
    return "";
  }

  const explicitMain = images.find((image) => image.is_main);
  return (explicitMain || images[0]).image_url || "";
}

export function getDisplayOfferType(item) {
  if (Number(item?.estimated_value || 0) <= 0) {
    return "free";
  }

  return item?.offer_type || "trade";
}

export function formatItemPrice(item) {
  const value = Number(item?.estimated_value || 0);

  if (value <= 0) {
    return "Free";
  }

  const currency = item?.currency || "USD";
  return `${value.toLocaleString()} ${currency}`;
}

async function attachImages(items, supabase) {
  if (!items.length) {
    return [];
  }

  const itemIds = items.map((item) => item.id);
  const { data: images, error: imagesError } = await supabase
    .from("item_images")
    .select("id, item_id, image_url, is_main, sort_order")
    .in("item_id", itemIds)
    .order("sort_order", { ascending: true });

  if (imagesError) {
    throw imagesError;
  }

  const imagesByItemId = new Map();

  (images || []).forEach((image) => {
    const bucket = imagesByItemId.get(image.item_id) || [];
    bucket.push(image);
    imagesByItemId.set(image.item_id, bucket);
  });

  return items.map((item) => ({
    ...item,
    image_url: chooseMainImage(imagesByItemId.get(item.id) || []),
  }));
}

export async function fetchPublicItems() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { items: [], isConfigured: false };
  }

  const { data: items, error } = await supabase
    .from("items")
    .select(PUBLIC_ITEM_COLUMNS)
    .eq("status", "active")
    .eq("accepted", true)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    throw error;
  }

  return {
    items: await attachImages(items || [], supabase),
    isConfigured: true,
  };
}

export async function fetchPublicItemById(itemId) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { item: null, isConfigured: false };
  }

  const { data: item, error } = await supabase
    .from("items")
    .select(PUBLIC_ITEM_COLUMNS)
    .eq("id", itemId)
    .eq("status", "active")
    .eq("accepted", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!item) {
    return { item: null, isConfigured: true };
  }

  const [withImage] = await attachImages([item], supabase);

  return {
    item: withImage,
    isConfigured: true,
  };
}
