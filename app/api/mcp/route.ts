import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { requireMcpAuth } from "@better-auth/mcp";
import { auth, MCP_RESOURCE, isOwnerEmail } from "@/lib/auth";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { getNeon } from "@/lib/neonDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}

function fail(message: string) {
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "patrick-rick-social-agent", version: "0.1.0" });
  server.registerTool(
    "workspace_status",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "Inspect active capabilities. Scheduling and publishing are disabled.",
      inputSchema: z.object({}),
    },
    async () => result({
      project: "Patrick Rick Social Agent",
      phase: "drafts_only",
      database: "Neon PostgreSQL",
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      canSchedule: false,
      canPublish: false,
      requiresHumanApproval: true,
    })
  );

  server.registerTool(
    "list_content_drafts",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "List content drafts without scheduling or publishing.",
      inputSchema: z.object({
        artist: z.enum(["patrick_rick", "chris_rick", "patrick_meets_rico"]).optional(),
        limit: z.number().int().min(1).max(25).default(10),
      }),
    },
    async ({ artist, limit }) => {
      try {
        const sql = getNeon();
        const rows = artist
          ? await sql`SELECT id, artist, platform, title, era, caption, planned_at,
                              status, created_at
                      FROM content_drafts WHERE artist = ${artist}
                      ORDER BY created_at DESC LIMIT ${limit}`
          : await sql`SELECT id, artist, platform, title, era, caption, planned_at,
                              status, created_at
                      FROM content_drafts
                      ORDER BY created_at DESC LIMIT ${limit}`;

        return result({ drafts: rows });
      } catch {
        return fail("Could not load drafts. Verify Neon DATABASE_URL and database/schema.sql.");
      }
    }
  );

  server.registerTool(
    "create_content_draft",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "Save a DRAFT only on user request. Never publishes, approves or schedules.",
      inputSchema: z.object({
        artist: z.enum(["patrick_rick", "chris_rick", "patrick_meets_rico"]),
        platform: z.enum(["instagram", "tiktok", "youtube"]),
        title: z.string().trim().min(1).max(160),
        era: z.string().trim().max(100).optional(),
        caption: z.string().trim().min(1).max(4000),
        planned_at: z.string().datetime({ offset: true }).optional(),
      }),
    },
    async ({ artist, platform, title, era, caption, planned_at }) => {
      try {
        const sql = getNeon();
        const rows = await sql`
          INSERT INTO content_drafts (
            artist, platform, title, era, caption, planned_at, status
          ) VALUES (
            ${artist}, ${platform}, ${title}, ${era ?? null},
            ${caption}, CAST(${planned_at ?? null} AS timestamptz), 'DRAFT'
          )
          RETURNING id, artist, platform, title, era, caption,
                    planned_at, status, created_at
        `;

        return result({ saved: true, draft: rows[0], scheduled: false, published: false });
      } catch {
        return fail("Could not save draft. Verify Neon connection and schema migration.");
      }
    }
  );

  server.registerTool(
    "catalog_summary",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "Read-only catalog overview. Counts are documentary, not verified Spotify releases.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const sql = getNeon();
        const [counts, eras] = await Promise.all([
          sql`SELECT
               (SELECT COUNT(*)::integer FROM catalog.artists) AS artists,
               (SELECT COUNT(*)::integer FROM catalog.eras) AS eras,
               (SELECT COUNT(*)::integer FROM catalog.albums) AS albums,
               (SELECT COUNT(*)::integer FROM catalog.songs) AS documented_songs,
               (SELECT COUNT(*)::integer FROM catalog.album_tracks) AS track_positions,
               (SELECT COUNT(*)::integer FROM catalog.releases WHERE status='RELEASED') AS verified_releases`,
          sql`SELECT era_key, title, color, emotional_core
              FROM catalog.eras ORDER BY canonical_order`,
        ]);
        return result({ catalog: counts[0], eras, note: "Unknown release dates and statuses are not inferred." });
      } catch {
        return fail("Catalog not available on this environment. Apply reviewed Phase 2 migration first.");
      }
    },
  );

  server.registerTool(
    "list_catalog_albums",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "Read-only album catalog with source and documentary publication status.",
      inputSchema: z.object({
        artist: z.enum(["patrick_rick", "chris_rick", "patrick_meets_rico"]).optional(),
        era: z.enum(["blue", "yellow", "red", "green"]).optional(),
        limit: z.number().int().min(1).max(50).default(25),
      }),
    },
    async ({ artist, era, limit }) => {
      try {
        const sql = getNeon();
        const rows = await sql`
          SELECT a.album_key, a.title, a.artist_key, a.era_key, a.album_kind,
                 a.chapter_label, a.publication_status, a.verification_state,
                 a.source_key, COUNT(t.song_key)::integer AS track_positions
          FROM catalog.albums a
          LEFT JOIN catalog.album_tracks t ON t.album_key = a.album_key
          WHERE (${artist ?? null}::text IS NULL OR a.artist_key = ${artist ?? null})
            AND (${era ?? null}::text IS NULL OR a.era_key = ${era ?? null})
          GROUP BY a.album_key
          ORDER BY a.album_kind, a.title LIMIT ${limit}`;
        return result({ albums: rows });
      } catch {
        return fail("Could not read album catalog.");
      }
    },
  );

  server.registerTool(
    "get_catalog_album_tracks",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "Read-only documentary album track list. No assumption that similarly titled songs are the same recording.",
      inputSchema: z.object({
        album_key: z.string().regex(/^[a-z0-9-]{3,100}$/),
      }),
    },
    async ({ album_key }) => {
      try {
        const sql = getNeon();
        const albums = await sql`SELECT album_key, title, artist_key, album_kind, era_key,
                              concept, canonical_phrase, publication_status, source_key
                              FROM catalog.albums WHERE album_key=${album_key}`;
        if (!albums.length) return fail("Album not documented.");
        const tracks = await sql`SELECT t.disc_number, d.title AS disc_title, t.track_number,
                                        s.song_key, s.title, s.lyrics_state, s.composition_state,
                                        t.source_key
                                 FROM catalog.album_tracks t
                                 JOIN catalog.songs s ON s.song_key=t.song_key
                                 JOIN catalog.discs d ON d.album_key=t.album_key
                                   AND d.disc_number=t.disc_number
                                 WHERE t.album_key=${album_key}
                                 ORDER BY t.disc_number,t.track_number`;
        return result({ album: albums[0], tracks, tracklistDocumented: tracks.length > 0 });
      } catch {
        return fail("Could not read album tracks.");
      }
    },
  );

  return server;
}, { legacy: "reject" });

function authorized(request: Request): boolean {
  const secret = process.env.AGENT_MCP_TOKEN;
  if (!secret || secret.length < 32) return false;

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;

  const incoming = Buffer.from(header.slice(7), "utf8");
  const expected = Buffer.from(secret, "utf8");
  return incoming.length === expected.length &&
    timingSafeEqual(incoming, expected);
}

async function secured(request: Request): Promise<Response> {
  if (!process.env.AGENT_MCP_TOKEN || process.env.AGENT_MCP_TOKEN.length < 32) {
    return Response.json({ error: "MCP server not configured" }, { status: 503 });
  }

  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="Patrick Rick MCP"' },
    });
  }

  return handler.fetch(request);
}

const oauthSecured = requireMcpAuth(auth, async (request, claims) => {
  if (typeof claims.sub !== "string") return Response.json({ error: "Forbidden" }, { status: 403 });
  const rows = await getNeon()`SELECT email FROM "user" WHERE id = ${claims.sub}`;
  if (!isOwnerEmail(rows[0]?.email)) return Response.json({ error: "Forbidden" }, { status: 403 });
  return handler.fetch(request);
}, { resource: MCP_RESOURCE, requiredScopes: ["mcp:tools"] });

export async function POST(request: Request) {
  try {
    return process.env.PATRICK_MCP_AUTH_MODE === "oauth" ? await oauthSecured(request) : await secured(request);
  } catch {
    return Response.json({ error: "Authentication service unavailable" }, { status: 503 });
  }
}
