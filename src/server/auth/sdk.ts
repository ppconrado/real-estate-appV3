import axios, { type AxiosInstance } from "axios";
import { SignJWT, jwtVerify } from "jose";
import { AXIOS_TIMEOUT_MS } from "@/shared/const";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

type ExchangeTokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  scope?: string;
  idToken?: string;
};

type UserInfoResponse = {
  openId: string;
  projectId: string;
  name: string;
  email?: string | null;
  platform?: string | null;
  loginMethod?: string | null;
};

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const getAppId = () =>
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_APP_ID || "";

const createOAuthHttpClient = (): AxiosInstance =>
  axios.create({
    baseURL: process.env.OAUTH_SERVER_URL || "",
    timeout: AXIOS_TIMEOUT_MS,
  });

class SDKServer {
  private readonly client: AxiosInstance;

  constructor(client: AxiosInstance = createOAuthHttpClient()) {
    this.client = client;
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error(
        "[OAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment."
      );
    }
  }

  private decodeState(state: string): string {
    return Buffer.from(state, "base64").toString("utf8");
  }

  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    const redirectUri = this.decodeState(state);
    const payload = new URLSearchParams({
      client_id: getAppId(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const { data } = await this.client.post<{
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token?: string;
      scope?: string;
      id_token?: string;
    }>(GOOGLE_TOKEN_URL, payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
      scope: data.scope,
      idToken: data.id_token,
    };
  }

  async getUserInfo(accessToken: string): Promise<UserInfoResponse> {
    const { data } = await this.client.get<{
      sub: string;
      name?: string;
      email?: string;
    }>(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      openId: data.sub,
      projectId: getAppId(),
      name: data.name ?? "",
      email: data.email ?? null,
      platform: "google",
      loginMethod: "google",
    } as UserInfoResponse;
  }

  private getSessionSecret() {
    const secret = process.env.JWT_SECRET || "";
    return new TextEncoder().encode(secret);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: getAppId(),
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? 1000 * 60 * 60 * 24 * 365;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return { openId, appId, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async getUserInfoWithJwt(jwtToken: string): Promise<UserInfoResponse> {
    const session = await this.verifySession(jwtToken);
    if (!session) {
      throw new Error("Invalid session cookie");
    }

    return {
      openId: session.openId,
      projectId: getAppId(),
      name: session.name,
      email: null,
      platform: "google",
      loginMethod: "google",
    } as UserInfoResponse;
  }
}

export const sdk = new SDKServer();
