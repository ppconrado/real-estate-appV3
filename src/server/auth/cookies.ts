import { serialize } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "@/shared/const";

type CookieOptions = {
  httpOnly: boolean;
  path: string;
  sameSite: "lax" | "none" | "strict";
  secure: boolean;
};

function isSecureRequest(req: Request) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto
      .split(",")
      .some(proto => proto.trim().toLowerCase() === "https");
  }

  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function getSessionCookieOptions(req: Request): CookieOptions {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}

export function buildSessionCookie(value: string, req: Request) {
  const options = getSessionCookieOptions(req);
  return serialize(COOKIE_NAME, value, {
    ...options,
    maxAge: Math.floor(ONE_YEAR_MS / 1000),
    expires: new Date(Date.now() + ONE_YEAR_MS),
  });
}

export function buildClearSessionCookie(req: Request) {
  const options = getSessionCookieOptions(req);
  return serialize(COOKIE_NAME, "", {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  });
}

export function buildClearSessionCookieVariants(req: Request) {
  return buildClearCookieVariants(COOKIE_NAME, req);
}

export function buildClearCookieVariants(name: string, req: Request) {
  const base = {
    ...getSessionCookieOptions(req),
    maxAge: 0,
    expires: new Date(0),
  };

  const variants = [
    base,
    { ...base, secure: false, sameSite: "lax" as const },
    { ...base, secure: true, sameSite: "none" as const },
  ];

  const seen = new Set<string>();
  return variants
    .map(options => serialize(name, "", options))
    .filter(value => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}
