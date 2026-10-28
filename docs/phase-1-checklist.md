# Patrick Rick / Social Agent — Neon Phase 1

This branch implements draft creation and listing only. Instagram, TikTok and YouTube auto-publishing remain OFF.

## Set up Neon
1. Select/create a Neon project and choose the branch/database used for this app.
2. Open the Neon SQL Editor and run the reviewed `database/schema.sql` migration.
3. Copy the **PostgreSQL connection string** from Neon into Vercel environment variable `DATABASE_URL` for this project. Set it as a server-only secret; never paste it into GitHub or chat.
4. Generate a random 32+-character `AGENT_MCP_TOKEN` and add it as a Vercel server-only secret. Start with Preview environment and later configure Production after review.
5. Use a dedicated least-privilege PostgreSQL role for production if practical. Never use a browser/public environment variable to store the database password.

## Verify before merging
- [ ] Review pull request and verify Next.js build.
- [ ] Verify Vercel Preview deploy succeeds.
- [ ] Confirm `GET /api/health` works.
- [ ] Confirm unauthenticated `/api/mcp` returns 401 after MCP token is configured.
- [ ] Check MCP tools respond only with authenticated access.
- [ ] Test a new draft and list it from Neon.
- [ ] Configure ChatGPT's private Patrick Rick Creative Director plugin with the verified MCP endpoint, in its secure connection flow.
- [ ] Confirm no publishing or scheduling tools are exposed.

Vercel deployment protection may restrict external MCP access; preserve authentication and review settings rather than making everything public.

### Not implemented
Voice-triggered external actions, social OAuth/API permissioning, rendering, scheduling and automatic posting require subsequent work and user approval.
