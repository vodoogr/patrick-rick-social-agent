import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { mcp } from "@better-auth/mcp";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { Pool } from "pg";

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
      // Fail closed at Better Auth level even if another route bypasses the API wrapper.
      if (ctx.path === "/sign-up/email") {
        throw new APIError("FORBIDDEN", { message: "Registration closed" });
      }
      if (ctx.path === "/sign-in/email" && !isOwnerEmail(String(ctx.body?.email ?? ""))) {
        throw new APIError("FORBIDDEN", { message: "Access denied" });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const owner = process.env.PATRICK_OWNER_EMAIL?.trim().toLowerCase();
          if (!owner || user.email.trim().toLowerCase() !== owner) {
            console.warn("OWNER_USER_CREATE_DENIED");
            throw new APIError("FORBIDDEN", { message: "Only the project owner may create an account" });
          }
          console.info("OWNER_USER_CREATE_GUARD_PASSED");
          return { data: { ...user, email: user.email.trim().toLowerCase() } };
        },
      },
    },
    session: { create: { before: async (session, context) => {
      let user;
      try {
        user = await context?.context.internalAdapter.findUserById(session.userId);
      } catch {
        console.error("OWNER_SESSION_LOOKUP_FAILED");
        throw new APIError("INTERNAL_SERVER_ERROR", { message: "Session unavailable" });
      }
      if (!isOwnerEmail(user?.email)) {
        // This can distinguish a transaction-visibility issue from an owner mismatch.
        console.warn("OWNER_SESSION_CREATE_DENIED", { userFound: Boolean(user) });
        throw new APIError("FORBIDDEN", { message: "Access denied" });
      }
      console.info("OWNER_SESSION_GUARD_PASSED");
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
