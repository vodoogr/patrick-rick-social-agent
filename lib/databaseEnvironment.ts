// Hosted deployments require a connection and endpoint explicitly scoped to
// the deployment environment. Preview never falls back to DATABASE_URL.
export function databaseConnection(env: Record<string, string | undefined> = process.env) {
  const deployment = env.VERCEL_ENV;
  if (env.VERCEL && !deployment) return undefined;

  const connection = deployment === "preview"
    ? env.PATRICK_PREVIEW_DATABASE_URL
    : env.DATABASE_URL;
  if (!connection || (deployment && deployment !== "preview" && deployment !== "production")) {
    return undefined;
  }

  const endpoint = env.PATRICK_DATABASE_HOST;
  if (!deployment && !endpoint) return connection;
  try {
    const url = new URL(connection);
    if ((url.protocol === "postgresql:" || url.protocol === "postgres:") &&
        url.hostname === endpoint && url.pathname === "/patrick_rick_db" &&
        !url.searchParams.has("host") && !url.searchParams.has("hostaddr") &&
        !url.searchParams.has("dbname") && !url.searchParams.has("service") &&
        !url.searchParams.has("connectionString")) {
      return connection;
    }
  } catch {
    // A malformed URL is an unavailable connection.
  }
  return undefined;
}

export function databaseCapability(flag: string) {
  return process.env[flag] === "true" && Boolean(databaseConnection());
}
