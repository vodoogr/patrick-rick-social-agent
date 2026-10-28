import { neon } from "@neondatabase/serverless";

// Credentials are read on the server only. No browser/client exports.
export function getNeon() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set in the server environment");
  }
  return neon(databaseUrl);
}
