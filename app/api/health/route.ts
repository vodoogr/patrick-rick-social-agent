export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    service: "patrick-rick-social-agent",
    status: "ok",
    stage: "drafts-only",
    publishingEnabled: false,
  });
}
