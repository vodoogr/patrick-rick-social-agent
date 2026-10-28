import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { requireMcpAuth } from "@better-auth/mcp";
import { verifyOAuthQueryParams } from "@better-auth/oauth-provider";

process.env.BETTER_AUTH_SECRET = "test-only-secret-not-for-deployment-123456789";
process.env.PATRICK_APP_ORIGIN = "http://localhost:3000";
process.env.PATRICK_OWNER_EMAIL = "owner@example.invalid";

test("discovery agrees on issuer, resource, CIMD and closed grants", async () => {
  const { auth, MCP_RESOURCE } = await import("../lib/auth");
  const metadata = await auth.handler(new Request("http://localhost:3000/.well-known/oauth-authorization-server/api/auth"));
  assert.equal(metadata.status, 200);
  const data = await metadata.json();
  assert.equal(data.issuer, "http://localhost:3000/api/auth");
  assert.equal(data.client_id_metadata_document_supported, true);
  assert.equal(data.registration_endpoint, undefined);
  assert.ok(!data.grant_types_supported.includes("client_credentials"));
  const resource = await auth.handler(new Request("http://localhost:3000/.well-known/oauth-protected-resource/api/mcp"));
  assert.equal(resource.status, 200);
  const body = await resource.json();
  assert.equal(body.resource, MCP_RESOURCE);
  assert.deepEqual(body.authorization_servers, [data.issuer]);
});

test("unapproved owner registration and non-owner sign-in are denied before database access", async () => {
  const { auth, isOwnerEmail } = await import("../lib/auth");
  assert.equal(isOwnerEmail("OWNER@example.invalid"), true);
  assert.equal(isOwnerEmail("attacker@example.invalid"), false);
  for (const path of ["sign-up/email", "sign-in/email"]) {
    const response = await auth.handler(new Request(`http://localhost:3000/api/auth/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ name: "test", email: "attacker@example.invalid", password: "not-a-real-password-12345" }),
    }));
    assert.equal(response.status, 403);
  }
  assert.equal(await verifyOAuthQueryParams("client_id=evil&scope=mcp:tools", process.env.BETTER_AUTH_SECRET!), false);
});

test("MCP rejects absent, tampered, expired, wrong issuer/audience and missing scope tokens", async () => {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA");
  const jwk = { ...await exportJWK(publicKey), kid: "audit-key", alg: "EdDSA" };
  const server = createServer((_req, res) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  const issuer = origin + "/api/auth";
  const resource = origin + "/api/mcp";
  const handler = requireMcpAuth({ options: {}, $context: Promise.resolve({ baseURL: issuer, internalAdapter: {} as never }) },
    async () => Response.json({ accepted: true }), { resource, requiredScopes: ["mcp:tools"] });
  async function token(overrides: Record<string, unknown> = {}) {
    return new SignJWT({ sub: "owner", azp: "audit-client", scope: "mcp:tools", iss: issuer, aud: resource, exp: Math.floor(Date.now()/1000)+60, ...overrides })
      .setProtectedHeader({ alg: "EdDSA", kid: "audit-key" }).sign(privateKey);
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [jwk] });
  const request = (value?: string) => handler(new Request(resource, { method: "POST", headers: value ? { Authorization: `Bearer ${value}` } : {} }));
  try {
    const missing = await request();
    assert.equal(missing.status, 401);
    assert.match(missing.headers.get("www-authenticate")!, /resource_metadata/);
    assert.equal((await request(await token())).status, 200);
    for (const overrides of [{ iss: "https://evil.invalid" }, { aud: "https://evil.invalid" }, { exp: 1 }]) {
      assert.equal((await request(await token(overrides))).status, 401);
    }
    const valid = await token();
    assert.equal((await request(valid.slice(0, -8) + "abcdefgh")).status, 401);
    assert.equal((await request(await token({ scope: "openid" }))).status, 403);
  } finally { globalThis.fetch = originalFetch; server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
