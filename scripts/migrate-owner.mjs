#!/usr/bin/env node
/**
 * Transfer ONLY the already-provisioned Better Auth owner and credential account
 * from the preview Neon branch to production. No sessions or OAuth secrets move.
 *
 * Requirements:
 *   Node.js 24+, npm ci, local .env.migration.local (gitignored).
 *   PATRICK_SOURCE_DATABASE_URL, PATRICK_TARGET_DATABASE_URL, PATRICK_OWNER_EMAIL.
 *
 * Dry-run: node --env-file=.env.migration.local scripts/migrate-owner.mjs
 * Apply:   node --env-file=.env.migration.local scripts/migrate-owner.mjs --apply
 *
 * Do not share connection strings, account rows, password hashes or local env files.
 */
import pg from "pg";

const { Client } = pg;
const APPLY = process.argv.length === 3 && process.argv[2] === "--apply";
if (!(process.argv.length === 2 || APPLY)) {
  console.error("Usage: node scripts/migrate-owner.mjs [--apply]");
  process.exit(2);
}

const fromUrl = process.env.PATRICK_SOURCE_DATABASE_URL;
const toUrl = process.env.PATRICK_TARGET_DATABASE_URL;
const owner = process.env.PATRICK_OWNER_EMAIL?.trim().toLowerCase();
if (!fromUrl || !toUrl || !owner || !owner.includes("@")) {
  console.error("Missing source/target database URLs or owner email in the local environment.");
  process.exit(2);
}
let sourceHost, targetHost;
try {
  sourceHost = new URL(fromUrl).hostname;
  targetHost = new URL(toUrl).hostname;
} catch {
  console.error("Invalid database URL format.");
  process.exit(2);
}
if (sourceHost === targetHost || !sourceHost.endsWith(".neon.tech") || !targetHost.endsWith(".neon.tech")) {
  console.error("Expected two DIFFERENT Neon branch endpoints. Aborting.");
  process.exit(2);
}

const source = new Client({ connectionString: fromUrl, connectionTimeoutMillis: 10000 });
const target = new Client({ connectionString: toUrl, connectionTimeoutMillis: 10000 });
let inTransaction = false;

function requireOne(rows, description) {
  if (rows.length !== 1) throw new Error(description + ": expected exactly one row.");
  return rows[0];
}
async function countRows(db, table) {
  const { rows } = await db.query(`SELECT COUNT(*)::integer AS n FROM public."${table}"`);
  return rows[0].n;
}

try {
  await source.connect();
  await target.connect();
  const sourceName = (await source.query("SELECT current_database() AS name")).rows[0].name;
  const targetName = (await target.query("SELECT current_database() AS name")).rows[0].name;
  if (sourceName !== "patrick_rick_db" || targetName !== "patrick_rick_db") {
    throw new Error("Unexpected database name.");
  }

  const sourceUser = requireOne((await source.query(
    'SELECT id, name, email, "emailVerified", image, "createdAt", "updatedAt" FROM public."user" WHERE lower(email) = $1',
    [owner],
  )).rows, "Source owner");
  if (await countRows(source, "user") !== 1) {
    throw new Error("Source contains additional users; review before copying.");
  }

  const sourceAccount = requireOne((await source.query(
    'SELECT id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt" FROM public.account WHERE "userId" = $1 AND "providerId" = $2',
    [sourceUser.id, "credential"],
  )).rows, "Source credential account");
  if (!sourceAccount.password || sourceAccount.userId !== sourceUser.id || await countRows(source, "account") !== 1) {
    throw new Error("Source credentials do not match the expected single-owner state.");
  }

  const existingUsers = await countRows(target, "user");
  const existingAccounts = await countRows(target, "account");
  const existingSessions = await countRows(target, "session");
  const existingOauthClients = await countRows(target, "oauthClient");
  if (existingUsers || existingAccounts || existingSessions || existingOauthClients) {
    throw new Error("Target already has user/authentication records. No data has been written.");
  }
  console.log("Preflight OK: source has one owner and one credential account.");
  console.log("Target has no users, accounts, sessions or OAuth clients.");
  if (!APPLY) {
    console.log("DRY RUN ONLY. To migrate, run the same command with --apply.");
    process.exitCode = 0;
  } else {
    await target.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    inTransaction = true;
    await target.query("SELECT pg_advisory_xact_lock(hashtext('patrick-owner-transfer-v1'))");
    if (await countRows(target, "user") !== 0 || await countRows(target, "account") !== 0) {
      throw new Error("Target changed during transfer; rolling back.");
    }

    const insertedOwner = await target.query(
      'INSERT INTO public."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [sourceUser.id, sourceUser.name, sourceUser.email, sourceUser.emailVerified,
       sourceUser.image, sourceUser.createdAt, sourceUser.updatedAt],
    );
    const insertedAccount = await target.query(
      'INSERT INTO public.account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [sourceAccount.id, sourceAccount.accountId, sourceAccount.providerId,
       sourceAccount.userId, sourceAccount.password, sourceAccount.createdAt, sourceAccount.updatedAt],
    );
    if (insertedOwner.rowCount !== 1 || insertedAccount.rowCount !== 1) {
      throw new Error("Unexpected inserted row count; rolling back.");
    }
    const checks = await target.query(
      'SELECT COUNT(*)::integer AS n FROM public."user" u JOIN public.account a ON a."userId" = u.id WHERE lower(u.email) = $1 AND a."providerId" = $2 AND a.password IS NOT NULL',
      [owner, "credential"],
    );
    if (checks.rows[0].n !== 1) throw new Error("Credential integrity check failed.");
    await target.query("COMMIT");
    inTransaction = false;
    console.log("SUCCESS: one owner + credential account migrated and verified.");
    console.log("No session, OAuth token, consent, JWKS, verification or draft records were copied.");
  }
} catch (error) {
  if (inTransaction) {
    try { await target.query("ROLLBACK"); } catch { /* best effort */ }
  }
  // Deliberately avoid logging error objects; database providers can include credentials.
  console.error("Migration stopped safely:", error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[REDACTED]") : "unknown error");
  process.exitCode = 1;
} finally {
  await Promise.allSettled([source.end(), target.end()]);
}
