# Patrick Rick / Social Agent — Phase 1
This branch only supports authenticated DRAFT creation and reading. No auto-publishing.
1. Review/merge pull request after successful build.
2. Apply database/schema.sql to your chosen Supabase database.
3. Add server-only Vercel variables: AGENT_MCP_TOKEN (random >=32 chars), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
4. Verify /api/health, /api/mcp returns 401 without valid bearer token, and tools respond after authentication.
5. Add verified HTTPS /api/mcp URL as remote MCP server to private Patrick Rick Creative Director plugin. Credential must be entered in the secure connection flow, never chat or GitHub.
6. Test create_content_draft and list_content_drafts, verify records in Supabase.
7. Only later implement per-platform OAuth/permissions, explicit approval workflow, scheduling and publishing.
Vercel SSO-protected domains may block MCP clients; configure access safely before connection.
