import { APP_ORIGIN, MCP_RESOURCE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      resource: MCP_RESOURCE,
      authorization_servers: [APP_ORIGIN + "/api/auth"],
      scopes_supported: ["mcp:tools"],
      bearer_methods_supported: ["header"],
    },
    { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } },
  );
}
