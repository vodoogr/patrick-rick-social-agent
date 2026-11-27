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
  assert.match(listing, /list_social_review_queue/);
  assert.match(listing, /record_social_review/);
  assert.match(listing, /save_social_calendar_proposal/);
  assert.match(listing, /list_social_calendar_proposals/);
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

test("calendar proposals fail closed outside Preview", async () => {
  const { POST } = await import("../app/api/mcp/route");
  for (const [name,args] of [
    ["list_social_calendar_proposals", {}],
    ["save_social_calendar_proposal", {title:"Test",items:[{draft_id:"00000000-0000-4000-8000-000000000001",suggested_date:"2026-12-01"}]}],
  ] as const) {
    const response = await POST(new Request("http://localhost:3000/api/mcp", {
      method:"POST", headers:{"content-type":"application/json",accept:"application/json, text/event-stream",authorization:`Bearer ${process.env.AGENT_MCP_TOKEN}`},
      body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/call",params:{name,arguments:args}}),
    }));
    const body=await response.text();
    assert.match(body,/Preview environment/);
    assert.match(body,/isError/);
  }
});

test("creative reviews fail closed outside Preview", async () => {
  const { POST } = await import("../app/api/mcp/route");
  for (const name of ["list_social_review_queue", "record_social_review"]) {
    const args = name === "record_social_review"
      ? { draft_id: "00000000-0000-4000-8000-000000000001", decision: "approved" }
      : {};
    const response = await POST(new Request("http://localhost:3000/api/mcp", {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${process.env.AGENT_MCP_TOKEN}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    }));
    const body = await response.text();
    assert.equal(response.status, 200, body);
    assert.match(body, /Preview environment/);
    assert.match(body, /isError/);
  }
});

test("social material writes are unavailable outside Preview", async () => {
  const { POST } = await import("../app/api/mcp/route");
  const payload = {
    jsonrpc: "2.0", id: 1, method: "tools/call", params: {
      name: "save_social_draft_material", arguments: {
        draft_id: "00000000-0000-4000-8000-000000000001", kind: "audio",
        label: "Fragmento", reference: "suno:example", state: "provided",
      },
    },
  };
  const response = await POST(new Request("http://localhost:3000/api/mcp", {
    method: "POST", headers: {
      "content-type": "application/json", accept: "application/json, text/event-stream",
      authorization: `Bearer ${process.env.AGENT_MCP_TOKEN}`,
    }, body: JSON.stringify(payload),
  }));
  const body = await response.text();
  assert.equal(response.status, 200, body);
  assert.match(body, /Saving social materials is unavailable/);
  assert.match(body, /isError/);
});
