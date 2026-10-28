import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { mcp } from "@better-auth/mcp";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { Pool } from "pg";
import { createHash, timingSafeEqual } from "node:crypto";
import { getNeon } from "@/lib/neonDb";

export const APP_ORIGIN = (process.env.PATRICK_APP_ORIGIN || "https://patrick-rick-social-agent.vercel.app").replace(/\/$/, "");
export const MCP_RESOURCE = APP_ORIGIN + "/api/mcp";

function safeMatches(actual: string, expected: string) {
  const a = createHash("sha256").update(actual).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export const auth = betterAuth({
  baseURL: APP_ORIGIN,
  basePath: "/api/auth",
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
      if (ctx.path !== "/sign-up/email") return;
      const owner = process.env.PATRICK_OWNER_EMAIL?.trim().toLowerCase();
      const setupSecret = process.env.AGENT_MCP_TOKEN;
      const supplied = ctx.headers?.get("x-patrick-setup-token") ?? "";
      const email = String(ctx.body?.email ?? "").trim().toLowerCase();
      if (!owner || !setupSecret || setupSecret.length < 32 ||
          !supplied || !safeMatches(supplied, setupSecret) || email !== owner) {
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
          return { data: user };
        },
      },
    },
  },
  plugins: [
    jwt(),
    mcp({
      loginPage: "/sign-in",
      consentPage: "/consent",
      resource: MCP_RESOURCE,
      scopes: ["openid", "profile", "offline_access", "mcp:tools"],
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
  ],
});
