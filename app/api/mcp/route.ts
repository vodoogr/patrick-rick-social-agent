import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { requireMcpAuth } from "@better-auth/mcp";
import { auth, MCP_RESOURCE, isOwnerEmail } from "@/lib/auth";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { getNeon } from "@/lib/neonDb";
import { databaseCapability, databaseConnection } from "@/lib/databaseEnvironment";
import { createVideoBrief } from "@/services/videoBrief";
import { videoProductionSchema } from "@/services/videoProduction";

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
  server.registerTool("save_video_production_draft", {
    _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
    description: "On explicit request, save shot and asset references as a draft in the configured database. Does not upload files, generate, schedule or publish.",
    inputSchema: videoProductionSchema,
  }, async (input) => {
    try {
      if (!databaseCapability("PATRICK_VIDEO_DRAFTS_ENABLED")) return fail("Video production drafts are disabled in this environment.");
      const sql = getNeon();
      const rows = await sql`INSERT INTO public.video_production_drafts (artist, song, version, title, shots, assets)
        VALUES (${input.artist}, ${input.song}, ${input.version}, ${input.title}, ${JSON.stringify(input.shots)}::jsonb, ${JSON.stringify(input.assets)}::jsonb)
        RETURNING id, artist, song, version, title, shots, assets, status, created_at`;
      return result({ draft: rows[0], filesUploaded: false, generated: false, scheduled: false, published: false });
    } catch { return fail("Could not save the video production draft."); }
  });
  server.registerTool("list_video_production_drafts", {
    _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
    description: "List video production drafts and their shot and asset references from the configured database.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(25).default(10) }),
  }, async ({ limit }) => {
    try {
      if (!databaseCapability("PATRICK_VIDEO_DRAFTS_ENABLED")) return fail("Video production drafts are disabled in this environment.");
      const sql = getNeon();
      const rows = await sql`SELECT id, artist, song, version, title, shots, assets, status, created_at
        FROM public.video_production_drafts ORDER BY created_at DESC LIMIT ${limit}`;
      return result({ drafts: rows, note: "Asset references are metadata; files are not uploaded." });
    } catch { return fail("Could not list video production drafts."); }
  });
  server.registerTool(
    "prepare_video_brief",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "Prepare a structured video production brief from supplied facts. Does not save, generate, schedule or publish.",
      inputSchema: z.object({
        song: z.string().trim().min(1).max(160),
        version: z.string().trim().min(1).max(160),
        artist: z.string().trim().min(1).max(120),
        location: z.string().trim().min(1).max(200),
        concept: z.string().trim().min(1).max(1500),
        wardrobe: z.string().trim().min(1).max(500),
        visualStyle: z.string().trim().min(1).max(500),
        audioReference: z.string().trim().max(500).optional(),
      }),
    },
    async (input) => result(createVideoBrief(input)),
  );
  server.registerTool(
    "workspace_status",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "Inspect active capabilities. Scheduling and publishing are disabled.",
      inputSchema: z.object({}),
    },
    async () => result({
      project: "Patrick Rick Social Agent",
      phase: "integrated_drafts",
      database: "Neon PostgreSQL",
      databaseConfigured: Boolean(databaseConnection()),
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
      if (!databaseCapability("PATRICK_SOCIAL_DRAFT_WRITES_ENABLED")) return fail("Social draft writes are disabled in this environment.");
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

  // Snapshot rows represent observed album positions, not unique compositions.
  // This reviewed, explicit snapshot cannot silently switch to a newer upload.
  const reviewSnapshot = "d0286d0dc0cf03caf5289c872c94b60d1c6f7739364507011bd15f1cdc590915";
  server.registerTool(
    "review_catalog_summary",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "Read-only overview of the user-supplied Suno album screenshots; positions are not unique songs or releases.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        if (!databaseCapability("PATRICK_CATALOG_REVIEW_ENABLED")) return fail("Catalog review is disabled in this environment.");
        const sql = getNeon();
        const rows = await sql`SELECT COUNT(*)::integer AS album_entries,
          COALESCE(SUM(jsonb_array_length(tracks)),0)::integer AS track_positions
          FROM catalog.review_album_snapshots WHERE snapshot_id=${reviewSnapshot}`;
        const manifest = await sql`SELECT manifest FROM catalog.review_catalog_metadata WHERE snapshot_id=${reviewSnapshot}`;
        if (!manifest.length || rows[0].album_entries !== 34 || rows[0].track_positions !== 543) return fail("Review snapshot missing or incomplete in this environment.");
        return result({ snapshot: reviewSnapshot, coverage: rows[0], manifest: manifest[0].manifest,
          note: "Observed screenshot positions; pending titles and publication status remain unverified." });
      } catch { return fail("Review catalog unavailable in this environment."); }
    },
  );
  server.registerTool(
    "list_review_albums",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "List album entries from reviewed user screenshots, including drafts and verification context.",
      inputSchema: z.object({ query: z.string().trim().max(120).optional(), limit: z.number().int().min(1).max(50).default(50) }),
    },
    async ({ query, limit }) => {
      try {
        if (!databaseCapability("PATRICK_CATALOG_REVIEW_ENABLED")) return fail("Catalog review is disabled in this environment.");
        const sql = getNeon();
        const snapshot = await sql`SELECT 1 FROM catalog.review_catalog_metadata WHERE snapshot_id=${reviewSnapshot}`;
        if (!snapshot.length) return fail("Review snapshot missing in this environment.");
        const rows = await sql`SELECT album_id, album->>'album' AS title, album->>'artista' AS artist,
          album->>'suno_estado' AS suno_status, album->>'numero_drive' AS project_number,
          jsonb_array_length(tracks)::integer AS track_positions, album->'fuentes' AS evidence
          FROM catalog.review_album_snapshots
          WHERE snapshot_id=${reviewSnapshot} AND (${query ?? ""} = '' OR position(lower(${query ?? ""}) in lower(album->>'album')) > 0)
          ORDER BY CASE WHEN album->>'numero_drive' ~ '^[0-9]+$' THEN (album->>'numero_drive')::integer ELSE 999 END, album->>'album'
          LIMIT ${limit}`;
        return result({ snapshot: reviewSnapshot, albums: rows, note: "Screenshot observations; Suno draft status is not Spotify publication status." });
      } catch { return fail("Could not read review album entries."); }
    },
  );
  server.registerTool(
    "get_review_album_tracks",
    {
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
      description: "Get screenshot-observed track positions and source notes; truncated titles and candidate matches remain pending.",
      inputSchema: z.object({ album_id: z.string().regex(/^alb_[a-f0-9]{12}$/) }),
    },
    async ({ album_id }) => {
      try {
        if (!databaseCapability("PATRICK_CATALOG_REVIEW_ENABLED")) return fail("Catalog review is disabled in this environment.");
        const sql = getNeon();
        const snapshot = await sql`SELECT 1 FROM catalog.review_catalog_metadata WHERE snapshot_id=${reviewSnapshot}`;
        if (!snapshot.length) return fail("Review snapshot missing in this environment.");
        const rows = await sql`SELECT album, tracks FROM catalog.review_album_snapshots
          WHERE snapshot_id=${reviewSnapshot} AND album_id=${album_id}`;
        if (!rows.length) return fail("Album not found in review snapshot.");
        return result({ snapshot: reviewSnapshot, ...rows[0], note: "Positions follow the screenshots. Similar titles are not automatically the same recording." });
      } catch { return fail("Could not read review album tracks."); }
    },
  );

  return server;
}, { legacy: "stateless" });

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
    if (process.env.PATRICK_MCP_AUTH_MODE === "oauth") return await oauthSecured(request);
    if (!process.env.VERCEL && !process.env.VERCEL_ENV && process.env.PATRICK_MCP_AUTH_MODE === "static") {
      return await secured(request);
    }
    return Response.json({ error: "OAuth is required" }, { status: 503 });
  } catch {
    return Response.json({ error: "Authentication service unavailable" }, { status: 503 });
  }
}

