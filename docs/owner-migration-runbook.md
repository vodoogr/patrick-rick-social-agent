# Migración segura de identidad — Neon Preview a Producción
**Proyecto:** Patrick Rick Social Agent · **Fecha de verificación:** 2026-11-12.

## Objetivo
Copiar el único registro propietario de `public."user"` y su única cuenta `public.account` de tipo `credential`, preservando el hash de contraseña sin exponerlo a un asistente, commits, logs ni terceros. **No** copiar `session`, `verification`, `jwks`, `oauth*` ni `content_drafts`. La operación no crea cuentas nuevas ni habilita registros.

## Precondiciones obligatorias
- Ramas de Neon: origen `preview/feature/mcp-drafts-phase1` (`br-odd-wind-b9y5r6oz`), destino `production` (`br-cold-bird-b9xib3uw`).
- Misma base de datos `patrick_rick_db` en ambos endpoints, y conexión segura TLS (`sslmode=require`).
- En origen debe haber exactamente **un usuario propietario** y **una cuenta credential** con password cifrada; destino totalmente vacío de usuarios, cuentas, sesiones y clientes OAuth.
- La aplicación de Producción **no debe estar escribiendo** nuevos usuarios durante el procedimiento.
- Usar un ordenador de confianza. No enviar conexiones ni hashes a ChatGPT. No ejecutar si alguna comprobación falla.

## Ejecución local: un único paso supervisado
1. En tu equipo, abre el repositorio en la rama `feature/mcp-drafts-phase1`. Ejecuta `npm ci` con Node.js 24+.
2. En [Neon](https://console.neon.tech/app/projects/royal-tree-12332492), copia **por separado** las cadenas de conexión privadas de la rama Preview y de Production, ambas para `patrick_rick_db`, desde el botón **Connect**. Confirma visualmente el nombre de la rama en cada copia.
3. Crea en la raíz un archivo local llamado `.env.migration.local` (está ignorado por Git). Su contenido, **solo en tu ordenador**, debe tener esta forma:

   ```dotenv
   PATRICK_SOURCE_DATABASE_URL=postgresql://<preview-endpoint-and-credentials>/patrick_rick_db?sslmode=require
   PATRICK_TARGET_DATABASE_URL=postgresql://<production-endpoint-and-credentials>/patrick_rick_db?sslmode=require
   PATRICK_OWNER_EMAIL=<your-owner-email>
   ```

   Sustituye los marcadores **localmente**. No pegues los valores reales en un chat ni un commit. Las contraseñas y hashes no aparecen en la salida del script.
4. Ejecuta la verificación sin escritura:

   ```bash
   node --env-file=.env.migration.local scripts/migrate-owner.mjs
   ```

   Debe terminar con `DRY RUN ONLY`. Si detecta contenido en destino, detente.
5. Si confirma origen y destino correctos, ejecuta:

   ```bash
   node --env-file=.env.migration.local scripts/migrate-owner.mjs --apply
   ```

   El script usa una transacción SQL con rollback por error. Debe confirmar `SUCCESS`. Un segundo intento fallará de forma segura si el destino ya tiene la cuenta.
6. Borra `.env.migration.local` después de verificar el resultado. No compartas capturas que muestren cadenas o correos de la cuenta.

## Verificación SQL sin secretos
Ejecutar en Neon SQL Editor para Production:
```sql
SELECT
  (SELECT count(*) FROM public."user") AS owner_count,
  (SELECT count(*) FROM public.account WHERE "providerId" = 'credential') AS credential_count,
  (SELECT count(*) FROM public.session) AS session_count,
  (SELECT count(*) FROM public."oauthClient") AS oauth_client_count;
```
Esperado inmediatamente después: `1 / 1 / 0 / 0`. No seleccionar `password`, tokens ni otros datos privados.

## Configuración Vercel Production (intervención humana)
En el proyecto `patrick-rick-social-agent`, consultar las Environment Variables desde el dashboard. El acceso por API del asistente actualmente devuelve **403**.
- `DATABASE_URL` (production): URL de la rama **Production** de Neon (server-only, secreta).
- `BETTER_AUTH_SECRET`: secreto robusto de producción, **sin copiarlo al repositorio**.
- `PATRICK_OWNER_EMAIL`: la misma cuenta que existe en Neon.
- `PATRICK_APP_ORIGIN`: el origen HTTPS **exacto** del dominio canónico de Vercel Production, sin barra final (confirmar dominios asignados).
- `PATRICK_MCP_AUTH_MODE`: `static` inicialmente; cambiar a `oauth` **solo tras** prueba real de login, consentimiento PKCE, metadata CIMD, JWT y herramientas.
- `AGENT_MCP_TOKEN`: secreto independiente de mínimo 32 caracteres, solo para modo `static`. No enviarlo a chats.
- NO añadir `PATRICK_SETUP_TOKEN` (retirado); NO añadir variables temporales de la migración al hosting.
Configurar el acceso externo de OAuth **sin eliminar indiscriminadamente la protección de Preview**. Un endpoint HTTPS público de metadata no equivale a permitir acceso anónimo al MCP.

## Validaciones posteriores
1. GitHub Actions (test/typecheck/build) y Vercel Preview en estado READY.
2. Revisar PR #1 y desplegar producción solo cuando Vercel tenga sus variables correctas.
3. Comprobar `/api/health` en la URL final (200 y base conectada).
4. Probar login del propietario; alta cerrada; ajenos denegados.
5. Probar flujo OAuth 2.1, CIMD y `tools/list` desde cliente real; el modo static no es un sustituto de esta prueba.
6. Guardar y recuperar un borrador. Comprobar que `publishingEnabled = false` y que no existen herramientas de publicación o programación.
7. Registrar versión de despliegue, rama y resultados. Solo entonces conectar el plugin privado v0.2.x.

**No usar** `pg_dump` sin filtrar: copiaría sesiones, tokens y claves firmantes innecesarias. Este script limita estrictamente la transferencia.
