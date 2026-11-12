import { getNeon } from "@/lib/neonDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getNeon()`SELECT 1 AS probe`;
    const connected = rows.length === 1 && Number(rows[0]?.probe) === 1;
    return Response.json({
      service: "patrick-rick-social-agent",
      stage: "drafts-only",
      database: connected ? "connected" : "unavailable",
      publishingEnabled: false,
    }, { status: connected ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    // Deliberately do not expose connection strings or internal error details.
    return Response.json({
      service: "patrick-rick-social-agent",
      stage: "drafts-only",
      database: "unavailable",
      publishingEnabled: false,
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
