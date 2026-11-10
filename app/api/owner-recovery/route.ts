import { createHash, timingSafeEqual } from "node:crypto";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Temporary, owner-only recovery for Preview. Remove after account access is restored.
// Automatically expires and can succeed only once in the Preview database.
const EXPIRES_AT = Date.parse("2026-11-17T23:59:59Z");
const RECOVERY_ID = "patrick-owner-recovery-2026-11";

function json(message: string, status: number) {
  return Response.json({ message }, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

function safeEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

export async function POST(request: Request) {
  // Never expose recovery on Production, another Git branch or a different origin.
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "feature/mcp-drafts-phase1" ||
    Date.now() > EXPIRES_AT
  ) return json("Recuperación no disponible.", 404);

  const origin = process.env.PATRICK_APP_ORIGIN?.replace(/\/$/, "");
  if (
    !origin ||
    !origin.startsWith("https://") ||
    request.headers.get("origin") !== origin ||
    new URL(request.url).origin !== origin
  ) return json("Solicitud no autorizada.", 403);

  if (!(request.headers.get("content-type") || "").startsWith("application/json"))
    return json("Solicitud inválida.", 400);
  if (Number(request.headers.get("content-length") || 0) > 4096)
    return json("Solicitud inválida.", 400);

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json("Solicitud inválida.", 400);
    body = JSON.parse(raw);
  } catch {
    return json("Solicitud inválida.", 400);
  }
  if (typeof body !== "object" || body === null || Array.isArray(body))
    return json("Solicitud inválida.", 400);

  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const token = typeof input.setupToken === "string" ? input.setupToken : "";
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";

  const expectedEmail = process.env.PATRICK_OWNER_EMAIL?.trim().toLowerCase();
  const expectedToken = process.env.PATRICK_SETUP_TOKEN;
  if (
    !expectedEmail || !expectedToken || expectedToken.length < 32 ||
    token.length < 32 || token.length > 256 ||
    !safeEqual(token, expectedToken) || email !== expectedEmail
  ) return json("Datos de recuperación no autorizados.", 403);

  if (newPassword.length < 14 || newPassword.length > 128)
    return json("La contraseña debe tener entre 14 y 128 caracteres.", 400);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return json("Recuperación no disponible.", 503);

  // Use Better Auth's own default password hasher; never store plaintext passwords.
  const hash = await hashPassword(newPassword);
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
  });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Unique marker prevents simultaneous requests or reuse of the recovery key.
    const claimed = await client.query(
      'INSERT INTO "verification" ("id", "identifier", "value", "expiresAt") VALUES ($1, $2, $3, $4) ON CONFLICT ("id") DO NOTHING RETURNING "id"',
      [RECOVERY_ID, RECOVERY_ID, "used", new Date("2099-01-01T00:00:00Z")],
    );
    if (claimed.rowCount !== 1) {
      await client.query("ROLLBACK");
      return json("Esta recuperación ya se ha utilizado.", 409);
    }

    const found = await client.query<{ id: string }>(
      'SELECT "id" FROM "user" WHERE lower("email") = $1 LIMIT 2',
      [expectedEmail],
    );
    if (found.rowCount !== 1) {
      await client.query("ROLLBACK");
      return json("Recuperación no disponible.", 403);
    }
    const ownerId = found.rows[0].id;
    const updated = await client.query(
      'UPDATE "account" SET "password" = $1, "updatedAt" = now() WHERE "userId" = $2 AND "providerId" = $3 AND "password" IS NOT NULL',
      [hash, ownerId, "credential"],
    );
    if (updated.rowCount !== 1) {
      await client.query("ROLLBACK");
      return json("Recuperación no disponible.", 403);
    }

    await client.query('DELETE FROM "session" WHERE "userId" = $1', [ownerId]);
    await client.query('DELETE FROM "oauthAccessToken" WHERE "userId" = $1', [ownerId]);
    await client.query('DELETE FROM "oauthRefreshToken" WHERE "userId" = $1', [ownerId]);
    await client.query("COMMIT");
    console.info("OWNER_PASSWORD_RECOVERY_COMPLETED");
    return json("Contraseña actualizada. Ya puedes iniciar sesión.", 200);
  } catch {
    if (client) {
      try { await client.query("ROLLBACK"); } catch { /* ignore */ }
    }
    // No token, email, password, SQL detail or connection string in logs.
    console.error("OWNER_PASSWORD_RECOVERY_FAILED");
    return json("No se ha podido completar la recuperación.", 503);
  } finally {
    client?.release();
    await pool.end();
  }
}
