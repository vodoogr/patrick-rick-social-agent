import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { mcp } from "@better-auth/mcp";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { Pool } from "pg";
import { createHash, timingSafeEqual } from "node:crypto";
import { getNeon } from "./neonDb";

const configuredOrigin = process.env.PATRICK_APP_ORIGIN ||
  (process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : "http://localhost:3000");
const originUrl = new URL(configuredOrigin);
if (originUrl.origin !== configuredOrigin.replace(/\/$/, "") ||
    (originUrl.protocol !== "https:" && !(originUrl.protocol === "http:" && ["localhost", "127.0.0.1"].includes(originUrl.hostname)))) {
  throw new Error("PATRICK_APP_ORIGIN must be an HTTPS origin (HTTP loopback for development)");
}
export const APP_ORIGIN = originUrl.origin;
export const MCP_RESOURCE = APP_ORIGIN + "/api/mcp";
export const isOwnerEmail = (email?: string | null) => Boolean(process.env.PATRICK_OWNER_EMAIL?.trim()) &&
  email?.trim().toLowerCase() === process.env.PATRICK_OWNER_EMAIL?.trim().toLowerCase();

function safeMatches(actual: string, expected: string) {
  const a = createHash("sha256").update(actual).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export const auth = betterAuth({
  baseURL: APP_ORIGIN,
  basePath: "/api/auth",
  trustedOrigins: [APP_ORIGIN],
  disabledPaths: ["/token", "/update-user", "/change-email", "/delete-user"],
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 14 },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email" && !isOwnerEmail(String(ctx.body?.email ?? ""))) {
        throw new APIError("FORBIDDEN", { message: "Access denied" });
      }
      if (ctx.path !== "/sign-up/email") return;
      const owner = process.env.PATRICK_OWNER_EMAIL?.trim().toLowerCase();
      const setupSecret = process.env.PATRICK_SETUP_TOKEN;
      const supplied = ctx.headers?.get("x-patrick-setup-token") ?? "";
      const email = String(ctx.body?.email ?? "").trim().toLowerCase();
      if (!owner || !setupSecret || setupSecret.length < 32 ||
          !supplied || !safeMatches(supplied, setupSecret) || email !== owner) {
        console.warn("Owner setup rejected", { ownerConfigured: Boolean(owner), setupConfigured: Boolean(setupSecret), setupLongEnough: Boolean(setupSecret && setupSecret.length >= 32), setupProvided: Boolean(supplied), setupMatches: Boolean(setupSecret && supplied && safeMatches(supplied, setupSecret)), emailMatches: Boolean(owner && email === owner) });
        throw new APIError("FORBIDDEN", { message: "Owner registration is not authorized" });
      }
      // Never permit new sign-ups once the first account exists.
      const alreadyRegistered = await getNeon()`SELECT id FROM "user" LIMIT 1`;
      if (alreadyRegistered.length > 0) {
        throw new APIError("FORBIDDEN", { message: "Owner already registered" });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const owner = process.env.PATRICK_OWNER_EMAIL?.trim().toLowerCase();
          if (!owner || user.email.trim().toLowerCase() !== owner) {
            throw new APIError("FORBIDDEN", { message: "Only the project owner may create an account" });
          }
          return { data: { ...user, email: user.email.trim().toLowerCase() } };
        },
      },
    },
    session: { create: { before: async (session, context) => {
      const user = await context?.context.internalAdapter.findUserById(session.userId);
      if (!isOwnerEmail(user?.email)) throw new APIError("FORBIDDEN", { message: "Access denied" });
      return { data: session };
    } } },
  },
  plugins: [
    jwt(),
    mcp({
      loginPage: "/sign-in",
      consentPage: "/consent",
      resource: MCP_RESOURCE,
      scopes: ["openid", "profile", "offline_access", "mcp:tools"],
      grantTypes: ["authorization_code", "refresh_token"],
      allowDynamicClientRegistration: false,
      allowUnauthenticatedClientRegistration: false,
      storeClientSecret: "hashed",
      storeTokens: "hashed",
      accessTokenExpiresIn: 300,
      refreshTokenReuseInterval: 0,
      clientPrivileges: async ({ user, action }) => isOwnerEmail(user?.email) && action !== "configure-client-credentials-scopes",
      resourcePrivileges: async ({ user }) => isOwnerEmail(user?.email),
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
  ],
});
