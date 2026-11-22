import { test } from "node:test";
import assert from "node:assert/strict";

process.env.AGENT_MCP_TOKEN = "local-test-token-not-for-production-123456";
process.env.PATRICK_MCP_AUTH_MODE = "static";
process.env.BETTER_AUTH_SECRET = "local-test-auth-secret-not-for-production-123";
process.env.PATRICK_APP_ORIGIN = "http://localhost:3000";
process.env.PATRICK_OWNER_EMAIL = "owner@example.invalid";

test("playlist update is discoverable and fails closed outside Preview", async () => {
  const { POST } = await import("../app/api/mcp/route");
  const call = async (method: string, params: object) => {
    const response = await POST(new Request("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${process.env.AGENT_MCP_TOKEN}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }));
    assert.equal(response.status, 200);
    return response.text();
  };
  const listing = await call("tools/list", {});
  assert.match(listing, /sync_suno_album_playlist/);
  assert.match(listing, /get_suno_album_playlist/);
  assert.match(listing, /validate_campaign_draft/);
  const response = await call("tools/call", {
    name: "sync_suno_album_playlist",
    arguments: {
      album_id: "alb_0b916d683f5b",
      playlist_id: "52eec88c-7ed8-4d34-bfbc-77c349daddf9",
      sync_version: "2026-01-01 00:00:00+00",
      expected_count: 1,
      clips: [{ id: "00000000-0000-4000-8000-000000000001", title: "Test" }],
    },
  });
  assert.match(response, /configured Preview environment/);
  assert.match(response, /isError/);
});
