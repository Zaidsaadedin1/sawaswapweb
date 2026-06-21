export const ANDROID_APP_URL = "https://play.google.com/store/apps/details?id=com.sawaswap.sawaswap&pli=1";
export const IOS_APP_URL = "https://apps.apple.com/us/app/sawaswap/id6772575984";

export function detectDevicePlatform(userAgent = "") {
  const normalizedUserAgent = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(normalizedUserAgent)) {
    return "ios";
  }

  if (/android/.test(normalizedUserAgent)) {
    return "android";
  }

  return "unknown";
}

export function getStoreUrlForPlatform(platform) {
  if (platform === "ios") {
    return IOS_APP_URL;
  }

  if (platform === "android") {
    return ANDROID_APP_URL;
  }

  return "";
}
