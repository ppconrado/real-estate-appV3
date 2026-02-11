export { COOKIE_NAME, ONE_YEAR_MS } from "@/shared/const";

const encodeBase64 = (value: string) => {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf-8").toString("base64");
  }
  return btoa(value);
};

export const getLoginUrl = (originOverride?: string) => {
  const appId =
    process.env.NEXT_PUBLIC_APP_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const origin =
    originOverride ??
    (typeof window === "undefined" ? "" : window.location.origin);

  if (!appId || !origin) {
    return "";
  }

  const redirectUri = `${origin}/api/oauth/callback`;
  const state = encodeBase64(redirectUri);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return url.toString();
};
