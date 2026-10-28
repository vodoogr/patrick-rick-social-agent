# OAuth audit — 2026-10-28

PR #1 remains a draft on `feature/mcp-drafts-phase1`. No production release or publishing integration is authorized by this phase.

## Verified

- Initial live schema: `patrick_rick_db`, production `br-cold-bird-b9xib3uw` and Preview `br-odd-wind-b9y5r6oz` contained only `public.content_drafts`.
- Generated SQL from the pinned Better Auth 1.7.14 options with an empty auth-schema snapshot. Direct local PostgreSQL access failed DNS resolution, so generation did not introspect live PostgreSQL locally.
- Applied the generated SQL transactionally using the Neon connector to isolated child `audit/oauth-2026-10-28` (`br-odd-cell-b9kidyr2`), cloned from production. Result: 13 public tables including the existing drafts table, 14 foreign keys, 38 indexes. Draft count stayed 0. Production and Preview were not migrated.
- Unit/integration boundary tests exercise actual Better Auth discovery, owner rejection, unsigned consent rejection and MCP token validation. Public JWKS fetch is stubbed in the token test; keys and signed tokens are real and ephemeral. This is not a full browser OAuth test.
- The previous Vercel Preview at commit `1f1f285` was READY. A new build must be checked for the updated commit.

## Changes

`mcp()` remains the sole OAuth provider, alongside JWT and CIMD's Node transport with SSRF protections. DCR and machine grants are explicitly disabled. OAuth client secrets and OAuth refresh/opaque tokens use hashed storage; JWT signing keys use Better Auth's encrypted storage. Browser session tokens retain Better Auth's own storage contract.

Issuer-path and resource-path discovery routes forward to Better Auth. The server origin defaults to the stable Vercel branch URL rather than the production domain. MCP now uses SDK v2 stateless POST transport and rejects legacy protocol. GET/DELETE return 405.

`PATRICK_MCP_AUTH_MODE=oauth` activates signature, issuer, audience, expiry, scope and DPoP validation, followed by a current database owner check. Default/static mode retains `AGENT_MCP_TOKEN`. OAuth mode never accepts that static token as a fallback. Access tokens expire after 5 minutes; local JWT validation does not provide immediate client or grant revocation.

Owner registration requires a distinct `PATRICK_SETUP_TOKEN` (32+ random characters) and configured owner email. Remove that setup variable after registration. Owner email is normalized for database uniqueness; sign-in and new sessions are owner-only. Consent checks the signed request, owner session, supported scopes and client existence. Additional explicit claims are rejected by this consent UI. The existing Better Auth browser plugin forwards the signed query and processes redirects.

## Next safe acceptance gate

1. Review `database/better-auth.sql`. It creates auth tables and indexes only; it must not be blindly rerun on a database with existing auth tables. Regenerate/diff with `npm run auth:plan` using a privately supplied connection when tables already exist. Never run reset/drop.
2. Confirm the actual DATABASE_URL bound to this specific Preview points to the intended Neon branch, then apply the reviewed SQL there transactionally. Keep production unchanged.
3. Set `PATRICK_APP_ORIGIN` to the stable Preview alias if overriding the Vercel branch default. Set a separate `PATRICK_SETUP_TOKEN` privately, create the owner at `/setup`, remove the setup variable and redeploy. Never send keys through chat.
4. Preserve Vercel Deployment Protection. Its edge authentication can block MCP discovery and the server's remote JWKS fetch. Use authenticated Vercel tooling to test; do not assume a successful build establishes external MCP reachability. Resolve a supported protected access path before enabling OAuth.
5. In Preview, test owner login → signed consent → deny/allow → authorization code with S256 PKCE → resource-bound access token → tools/list. Verify code replay and wrong verifier fail, refresh rotates, foreign owner/invalid tokens fail, and consent returns to the correct client. Test CIMD against the real intended client's metadata URL and callbacks; no open DCR fallback.
6. Only after those tests, set Preview `PATRICK_MCP_AUTH_MODE=oauth`, redeploy and repeat tools/list plus a requested draft round trip. Keep the PR unmerged until all gates pass.

References: https://better-auth.com/docs/plugins/mcp and https://better-auth.com/docs/plugins/oauth-provider.
