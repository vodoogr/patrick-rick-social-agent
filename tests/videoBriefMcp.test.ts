import { test } from "node:test";
import assert from "node:assert/strict";

test("authenticated MCP call returns the video brief", async () => {
  process.env.AGENT_MCP_TOKEN = "local-test-token-not-for-production-123456";
  process.env.PATRICK_MCP_AUTH_MODE = "static";
  process.env.BETTER_AUTH_SECRET = "local-test-auth-secret-not-for-production-123";
  process.env.PATRICK_APP_ORIGIN = "http://localhost:3000";
  process.env.PATRICK_OWNER_EMAIL = "owner@example.invalid";
  const { POST } = await import("../app/api/mcp/route");
  const payload = { jsonrpc: "2.0", id: 1, method: "tools/call", params: {
    _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientInfo": { name: "local-test", version: "1.0" }, "io.modelcontextprotocol/clientCapabilities": {} },
    name: "prepare_video_brief", arguments: { song: "Golden Dust", version: "Electro", artist: "Patrick Rick", location: "Granada", concept: "Alhambra", wardrobe: "Camisa azul", visualStyle: "Azul y amarillo" },
  } };
  const request = (auth: boolean) => new Request("http://localhost:3000/api/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2026-07-28", "mcp-method": "tools/call", "mcp-name": "prepare_video_brief", ...(auth ? { authorization: `Bearer ${process.env.AGENT_MCP_TOKEN}` } : {}) }, body: JSON.stringify(payload) });
  assert.equal((await POST(request(false))).status, 401);
  process.env.VERCEL_ENV = "preview";
  try {
    assert.equal((await POST(request(true))).status, 503);
  } finally {
    delete process.env.VERCEL_ENV;
  }
  const response = await POST(request(true));
  const body = await response.text();
  assert.equal(response.status, 200, body);
  assert.match(body, /Golden Dust/);
  assert.match(body, /Granada/);
});

