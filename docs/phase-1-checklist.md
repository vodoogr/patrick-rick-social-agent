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

## Estado verificado — 12 Nov 2026 (reanudación después del fallo del chat)

**Entornos / base de datos**
- Neon project `patrick-rick-ai` (ID `royal-tree-12332492`), PostgreSQL 18; base `patrick_rick_db`.
- Preview: `br-odd-wind-b9y5r6oz` (`preview/feature/mcp-drafts-phase1`). 13 tablas, 1 usuario propietario, 1 cuenta credential, 4 sesiones. `content_drafts`: 0.
- Production: `br-cold-bird-b9xib3uw` (`production`). 13 tablas, 0 usuarios, 0 cuentas, 0 sesiones y 0 borradores.
- Diff SQL de esquemas Preview vs Production: vacío. No duplicar ni reconstruir tablas.
- **MIGRACIÓN DE CUENTA PENDIENTE:** trasladar solo el propietario y la cuenta de credenciales; **no** sesiones ni tokens. El intento de transportar un hash de contraseña a través del asistente fue bloqueado por los controles de seguridad. No sortear ese bloqueo ni copiar secretos a chats/logs/commits. Requiere un flujo de traslado de datos directamente entre sistemas, fuera del modelo, o un procedimiento de alta segura revisado.
- No se han realizado modificaciones en los registros de Production durante la reanudación.

**Aplicación, autenticación y despliegues**
- Último Preview: commit `990451f` en `feature/mcp-drafts-phase1`, deployment `dpl_8qukAMybc1EG3tepPcHcRS6R9FLL`: READY.
- Endpoints Preview comprobados en vivo: `GET /api/health` → 200, `database: connected`, `publishingEnabled: false`; `GET /sign-in` → 200; `GET /api/auth/ok` → 200.
- Discovery OAuth: `/.well-known/oauth-authorization-server/api/auth` y `/.well-known/oauth-protected-resource/api/mcp` → 200. `/.well-known/oauth-authorization-server` raíz → 404; validar contra el cliente MCP real antes de interpretar este 404 como fallo.
- Production deployment `dpl_6z66e2TjgXvPpREuUWBHUFxk3dtZ` sigue en commit antiguo `2df6afe` de `main`: ERROR de build (`lint_or_type_error` / `npm run build`). La rama feature estaba 43 commits por delante de `main`, sin merge.
- Listado de variables del proyecto en Vercel: error 403 permission denied. No se consultaron ni expusieron valores secretos.
- Plugin privado `patrick-rick-creative-director` v0.2.0 existe, todavía sin conexión MCP activa.

**Orden obligatorio para continuar**
1. Migrar la cuenta propietaria con un mecanismo seguro, **sin transportar el hash a través del asistente**, y comprobar usuarios/cuentas en Production.
2. Verificar configuración de Vercel Production (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `PATRICK_OWNER_EMAIL`, `PATRICK_APP_ORIGIN`) con permisos adecuados, sin mostrar valores.
3. Validar sign-in y ciclo OAuth/MCP de extremo a extremo; mantener `PATRICK_MCP_AUTH_MODE` sin activar hasta que pase.
4. Revisar PR feature → main, ejecutar build y pruebas antes de desplegar producción.
5. Conectar plugin MCP cuando Production esté operativa; probar listar/crear borradores. No habilitar scheduling ni publicación automática sin autorización expresa.
