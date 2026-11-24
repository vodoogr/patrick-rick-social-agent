import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { requireMcpAuth } from "@better-auth/mcp";
import { auth, MCP_RESOURCE, isOwnerEmail } from "@/lib/auth";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { Pool } from "pg";
import { getNeon } from "@/lib/neonDb";
import { databaseCapability, databaseConnection } from "@/lib/databaseEnvironment";
import { createVideoBrief } from "@/services/videoBrief";
import { videoProductionSchema } from "@/services/videoProduction";
import { socialMaterialSchema, summarizeMaterials } from "@/services/socialMaterials";

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
  server.registerTool("import_suno_clips", {
    _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
    description: "On explicit request, record completed songs returned by the connected Suno library in Preview. Pass every page of Suno results in batches. Existing Suno IDs are updated, and album and release associations remain unconfirmed.",
    inputSchema: z.object({
      clips: z.array(z.object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(500),
        created_at: z.string().datetime({ offset: true }).optional(),
        visibility: z.enum(["public", "private"]).optional(),
      })).min(1).max(100),
    }),
  }, async ({ clips }) => {
    if (process.env.VERCEL_ENV !== "preview" || !databaseConnection()) {
      return fail("Suno imports are available only in the configured Preview environment.");
    }
    if (new Set(clips.map((clip) => clip.id.toLowerCase())).size !== clips.length) {
      return fail("Each Suno ID must occur only once per batch.");
    }
    try {
      const sql = getNeon();
      await sql`INSERT INTO catalog.sources (source_key, title, source_kind, notes)
        VALUES ('suno-library-sync', 'Suno library synchronization', 'PROVIDER_VERIFIED',
          'Entries supplied from the connected Suno library; album and publication status require separate evidence.')
        ON CONFLICT (source_key) DO NOTHING`;
      const rows = await sql`
        INSERT INTO catalog.suno_clips (clip_id, title, suno_url, created_at_suno, visibility, source_key)
        SELECT entry.id::uuid, entry.title, 'https://suno.com/song/' || entry.id,
          entry.created_at::timestamptz, entry.visibility, 'suno-library-sync'
        FROM jsonb_to_recordset(${JSON.stringify(clips)}::jsonb)
          AS entry(id text, title text, created_at text, visibility text)
        ON CONFLICT (clip_id) DO UPDATE SET title = EXCLUDED.title,
          suno_url = EXCLUDED.suno_url, created_at_suno = COALESCE(EXCLUDED.created_at_suno, catalog.suno_clips.created_at_suno),
          visibility = COALESCE(EXCLUDED.visibility, catalog.suno_clips.visibility), last_observed_at = now()
        RETURNING clip_id`;
      return result({ imported: rows.length, note: "Suno observations only. Album, song and release associations remain unconfirmed." });
    } catch {
      return fail("Could not import Suno observations. Check that the Preview catalog schema is available.");
    }
  });
  server.registerTool("sync_suno_album_playlist", {
    _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
    description: "On explicit request update one linked Preview album playlist. First call get_suno_album_playlist, then read every page from the Suno playlist. Supply its current clip_count, the complete ordered list and the returned sync_version. Never submit partial pages. Does not publish or schedule.",
    inputSchema: z.object({
      album_id: z.string().regex(/^alb_[a-f0-9]{12}$/),
      playlist_id: z.string().uuid(),
      sync_version: z.string().min(1).max(100),
      expected_count: z.number().int().min(1).max(500),
      clips: z.array(z.object({
        id: z.string().uuid(), title: z.string().trim().min(1).max(500),
        created_at: z.string().datetime({ offset: true }).optional(),
        visibility: z.enum(["public", "private"]).optional(),
      })).min(1).max(500),
    }),
  }, async ({ album_id, playlist_id, sync_version, expected_count, clips }) => {
    const connection = databaseConnection();
    if (process.env.VERCEL_ENV !== "preview" || !connection) return fail("Playlist updates require the configured Preview environment.");
    if (clips.length !== expected_count || new Set(clips.map((clip) => clip.id.toLowerCase())).size !== clips.length) {
      return fail("Playlist count does not match the complete unique Suno results. Read all pages before retrying.");
    }
    const pool = new Pool({ connectionString: connection, max: 1, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const current = await client.query(`SELECT c.collection_key FROM catalog.review_album_playlists l
          JOIN catalog.suno_collections c ON c.collection_key = l.collection_key
          WHERE l.snapshot_id = $1 AND l.album_id = $2 AND c.external_id = $3::uuid
            AND c.observed_at = $4::timestamptz FOR UPDATE OF c`,
          ["d0286d0dc0cf03caf5289c872c94b60d1c6f7739364507011bd15f1cdc590915", album_id, playlist_id, sync_version]);
        if (!current.rowCount) {
          await client.query("ROLLBACK");
          return fail("Playlist mapping or version changed. Read the album playlist again before retrying.");
        }
        const collectionKey = current.rows[0].collection_key;
        await client.query(`INSERT INTO catalog.sources (source_key,title,source_kind,notes)
          VALUES ('suno-library-sync','Suno library synchronization','PROVIDER_VERIFIED',
            'Suno observations; release status requires separate evidence.') ON CONFLICT (source_key) DO NOTHING`);
        await client.query(`INSERT INTO catalog.suno_clips (clip_id,title,suno_url,created_at_suno,visibility,source_key)
          SELECT x.id::uuid,x.title,'https://suno.com/song/' || x.id,x.created_at::timestamptz,x.visibility,'suno-library-sync'
          FROM jsonb_to_recordset($1::jsonb) AS x(id text,title text,created_at text,visibility text)
          ON CONFLICT (clip_id) DO UPDATE SET title=EXCLUDED.title,suno_url=EXCLUDED.suno_url,
            created_at_suno=COALESCE(EXCLUDED.created_at_suno,catalog.suno_clips.created_at_suno),
            visibility=COALESCE(EXCLUDED.visibility,catalog.suno_clips.visibility),last_observed_at=now()`, [JSON.stringify(clips)]);
        await client.query("DELETE FROM catalog.suno_collection_clips WHERE collection_key=$1", [collectionKey]);
        await client.query(`INSERT INTO catalog.suno_collection_clips (collection_key,clip_id,listed_position)
          SELECT $1, x.id::uuid, x.position::integer FROM jsonb_to_recordset($2::jsonb) AS x(id text,position integer)`,
          [collectionKey, JSON.stringify(clips.map((clip, index) => ({ id: clip.id, position: index + 1 })))]);
        await client.query("UPDATE catalog.suno_collections SET observed_clip_count=$2, observed_at=clock_timestamp() WHERE collection_key=$1", [collectionKey, clips.length]);
        await client.query("COMMIT");
        return result({ album_id, playlist_id, count: clips.length, scheduled: false, published: false });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally { client.release(); }
    } catch { return fail("Could not update the Suno playlist in Preview."); }
    finally { await pool.end(); }
  });
  server.registerTool("get_suno_album_playlist", {
    _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
    annotations: { readOnlyHint: true, destructiveHint: false },
    description: "Get the Suno playlist and ordered song versions linked to a reviewed album. Find album_id with list_review_albums first. Playlist membership does not imply a verified release.",
    inputSchema: z.object({ album_id: z.string().regex(/^alb_[a-f0-9]{12}$/) }),
  }, async ({ album_id }) => {
    try {
      const sql = getNeon();
      const rows = await sql`SELECT a.album->>'album' AS album, c.display_name AS playlist,
        c.external_url AS playlist_url, c.external_id AS playlist_id, c.observed_at::text AS sync_version, m.listed_position, s.clip_id, s.title, s.suno_url
        FROM catalog.review_album_playlists l
        JOIN catalog.review_album_snapshots a USING (snapshot_id, album_id)
        JOIN catalog.suno_collections c ON c.collection_key = l.collection_key
        JOIN catalog.suno_collection_clips m ON m.collection_key = c.collection_key
        JOIN catalog.suno_clips s ON s.clip_id = m.clip_id
        WHERE l.snapshot_id = 'd0286d0dc0cf03caf5289c872c94b60d1c6f7739364507011bd15f1cdc590915'
          AND l.album_id = ${album_id}
        ORDER BY m.listed_position, s.clip_id`;
      if (!rows.length) return fail("No Suno playlist is linked to this album in Preview.");
      return result({ album: rows[0].album, playlist: rows[0].playlist, playlist_url: rows[0].playlist_url, playlist_id: rows[0].playlist_id, sync_version: rows[0].sync_version,
        tracks: rows.map(({ listed_position, clip_id, title, suno_url }) => ({ listed_position, clip_id, title, suno_url })),
        note: "Playlist membership does not establish release status." });
    } catch { return fail("Could not read the linked Suno playlist."); }
  });
  server.registerTool("validate_campaign_draft", {
    _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
    annotations: { readOnlyHint: true, destructiveHint: false },
    description: "Check a proposed campaign against the selected reviewed album playlist in Preview. Returns factual checks and missing brief fields for human review. Does not approve, schedule or publish.",
    inputSchema: z.object({
      album_id: z.string().regex(/^alb_[a-f0-9]{12}$/),
      clip_id: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube"]),
      format: z.string().trim().max(160).optional(),
      objective: z.string().trim().max(500).optional(),
      copy: z.string().trim().max(4000).optional(),
      asset: z.string().trim().max(1000).optional(),
    }),
  }, async ({ album_id, clip_id, platform, format, objective, copy, asset }) => {
    try {
      const sql = getNeon();
      const rows = await sql`SELECT a.album->>'album' AS album, c.display_name AS playlist,
          s.clip_id, s.title, s.suno_url, m.listed_position
        FROM catalog.review_album_playlists l
        JOIN catalog.review_album_snapshots a USING (snapshot_id,album_id)
        JOIN catalog.suno_collections c ON c.collection_key=l.collection_key
        JOIN catalog.suno_collection_clips m ON m.collection_key=c.collection_key
        JOIN catalog.suno_clips s ON s.clip_id=m.clip_id
        WHERE l.snapshot_id='d0286d0dc0cf03caf5289c872c94b60d1c6f7739364507011bd15f1cdc590915'
          AND l.album_id=${album_id} AND s.clip_id=${clip_id}::uuid`;
      if (!rows.length) return result({ status: "NEEDS_EVIDENCE", album_id, clip_id,
        issues: ["The selected version was not found in the linked album playlist."], approved: false });
      const missing = [!format && "format", !objective && "objective", !copy && "copy", !asset && "asset"].filter(Boolean);
      return result({ status: missing.length ? "NEEDS_CHANGES" : "READY_FOR_HUMAN_REVIEW",
        platform, album: rows[0], missing, approved: false, scheduled: false, published: false,
        note: "Playlist membership does not establish publication status or rights. Human creative and factual review remains necessary." });
    } catch { return fail("Could not validate the campaign against the Preview playlist."); }
  });
  server.registerTool("list_suno_clips", {
    _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
    description: "Search Suno library observations recorded in the Preview catalog. Observations do not confirm album membership or publication.",
    inputSchema: z.object({ query: z.string().trim().max(200).optional(), limit: z.number().int().min(1).max(100).default(25), offset: z.number().int().min(0).default(0) }),
  }, async ({ query, limit, offset }) => {
    try {
      const sql = getNeon();
      const rows = await sql`SELECT clip_id, title, suno_url, created_at_suno, visibility, last_observed_at
        FROM catalog.suno_clips WHERE position(lower(${query ?? ""}) in lower(title)) > 0
        ORDER BY created_at_suno DESC NULLS LAST, clip_id LIMIT ${limit + 1} OFFSET ${offset}`;
      return result({ clips: rows.slice(0, limit), next_offset: rows.length > limit ? offset + limit : null, note: "Suno observations do not establish album membership or publication." });
    } catch { return fail("Could not read Suno observations."); }
  });
  server.registerTool("save_social_draft_material", {
    _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
    description: "On explicit user request, save or update a material reference for a DRAFT social post in Preview. The same draft, kind and label update the same entry. This records metadata and does not upload files, approve, schedule or publish.",
    inputSchema: socialMaterialSchema,
  }, async (material) => {
    if (process.env.VERCEL_ENV !== "preview" || !databaseCapability("PATRICK_SOCIAL_DRAFT_WRITES_ENABLED")) {
      return fail("Saving social materials is unavailable in this environment.");
    }
    try {
      const sql = getNeon();
      const rows = await sql`WITH draft AS (
        SELECT id FROM public.content_drafts WHERE id=${material.draft_id}::uuid AND status='DRAFT' FOR UPDATE
      )
      INSERT INTO public.social_draft_materials (draft_id,kind,label,reference,state,start_seconds,end_seconds)
      SELECT draft.id,${material.kind},${material.label},${material.reference},${material.state},
        ${material.start_seconds ?? null},${material.end_seconds ?? null} FROM draft
      ON CONFLICT (draft_id,kind,label) DO UPDATE SET reference=EXCLUDED.reference,state=EXCLUDED.state,
        start_seconds=EXCLUDED.start_seconds,end_seconds=EXCLUDED.end_seconds,updated_at=now()
      RETURNING id,draft_id,kind,label,reference,state,start_seconds,end_seconds,updated_at`;
      if (!rows.length) return fail("The draft was not found or is no longer in DRAFT status.");
      return result({ material: rows[0], uploaded: false, scheduled: false, published: false });
    } catch { return fail("Could not save the social material reference."); }
  });
  server.registerTool("get_social_draft_materials", {
    _meta: { securitySchemes: [{ type: "oauth2", scopes: ["mcp:tools"] }] },
    annotations: { readOnlyHint: true, destructiveHint: false },
    description: "Read a social draft and its recorded material references, including which reference types are supplied. References and rights are not verified.",
    inputSchema: z.object({ draft_id: z.string().uuid() }),
  }, async ({ draft_id }) => {
    try {
      const sql = getNeon();
      const drafts = await sql`SELECT id,artist,platform,title,era,caption,status,created_at
        FROM public.content_drafts WHERE id=${draft_id}::uuid`;
      if (!drafts.length) return fail("Social draft not found.");
      const materials = await sql`SELECT id,kind,label,reference,state,start_seconds,end_seconds,updated_at
        FROM public.social_draft_materials WHERE draft_id=${draft_id}::uuid ORDER BY created_at,id`;
      return result({ draft: drafts[0], materials, reference_status: summarizeMaterials(materials as Array<{ kind: string; state: string }>) });
    } catch { return fail("Could not read the social draft materials."); }
  });
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

