# Patrick Rick Social Agent · Integración de fases 1–2–3

La rama de integración parte de `44d3332`. Los PR #1, #2 y #3 forman una cadena de ancestros sobre `main` (`2df6afe` durante la revisión). El mismo endpoint `/api/mcp` sirve catálogo, borradores sociales y fichas audiovisuales. El agente guarda borradores únicamente por petición explícita y mantiene la aprobación humana. Las herramientas carecen de acciones de programación, publicación y generación de medios.

## Migraciones y datos

La rama Neon `br-flat-feather-b9ryk5wt` deriva de producción `br-cold-bird-b9xib3uw` en el LSN `0/20CB3D8`. El preflight encontró las doce tablas de Better Auth y `public.content_drafts`, con un borrador preexistente. La copia también hereda material de autenticación de producción. Reservarla para verificar la migración y preparar un destino de Preview con identidad, credenciales y datos de prueba propios.

1. Verificar proyecto, rama, LSN y base `patrick_rick_db`. Medir tablas, restricciones y recuentos existentes con consultas de solo lectura.
2. Aplicar `database/schema.sql`. Para Better Auth, verificar el esquema existente frente a `database/better-auth.sql`. El SQL generado de Better Auth no es idempotente. Aplicarlo solamente en una instalación nueva y detenerse si el esquema existente está incompleto.
3. Aplicar en orden `catalog_phase2.sql`, `catalog_seed_phase2.sql`, `catalog_suno_observations_phase2.sql`, `catalog_review_snapshot.sql` y `video_production_phase3.sql`. Ejecutar en una transacción, retirando el BEGIN y COMMIT del archivo semilla si se usa una transacción exterior.
4. Importar exclusivamente el snapshot documental revisado desde `br-ancient-hill-b9o9k7e7`. Verificar la clave del snapshot, comparar las filas JSON de origen y destino, y comprobar las 34 entradas y 543 posiciones. Preservar la distinción entre observación en Suno y publicación verificada.
5. Comparar los recuentos y el contenido de borradores y cuentas existentes. El ensayo audiovisual `br-lingering-lab-b9wniglt` no es fuente de borradores. Los borradores sociales, audiovisuales, las sesiones y las claves de los entornos de prueba quedan fuera del proceso de promoción.

## Vercel y ChatGPT

- Preview usa `PATRICK_PREVIEW_DATABASE_URL` y `PATRICK_DATABASE_HOST`; Production usa `DATABASE_URL` y su propio `PATRICK_DATABASE_HOST`. Limitar las variables de Preview a la rama Git de integración y verificar por separado que el endpoint pertenece a la rama Neon autorizada.
- Configurar `PATRICK_MCP_AUTH_MODE=oauth`, `PATRICK_APP_ORIGIN` con el origen HTTPS estable, `BETTER_AUTH_SECRET` propio del entorno y `PATRICK_OWNER_EMAIL`. Usar el gestor de secretos del entorno. El modo estático queda limitado a pruebas locales.
- Activar explícitamente `PATRICK_SOCIAL_DRAFT_WRITES_ENABLED`, `PATRICK_VIDEO_DRAFTS_ENABLED` y `PATRICK_CATALOG_REVIEW_ENABLED` tras verificar conexión, migraciones y permisos. Todas se evalúan como desactivadas al omitirse.
- Validar salud y descubrimiento OAuth, emisor y recurso, PKCE S256, consentimiento, inicio de sesión exclusivo del propietario y sesión iniciada desde ChatGPT. Comprobar 401 sin credenciales, rechazo de token con audiencia incorrecta o sin alcance y denegación a usuarios ajenos al propietario. Revisar que solo estén disponibles acciones previstas.
- Probar consulta del catálogo y del snapshot, ficha de Golden Dust, creación y lectura de un borrador social y uno audiovisual con aprobación del propietario en un Preview con datos de prueba propios. Comprobar que los estados siguen siendo de borrador y que ambas respuestas informan que no se programó ni publicó. Los datos de este ensayo se excluyen de producción.

## Puerta de producción

1. Exigir Preview funcional, OAuth real en ChatGPT y auditoría de dependencias satisfactoria. Registrar el SHA del código y el resultado de cada verificación.
2. Obtener autorización expresa para la estrategia de fusión y el despliegue definitivo. Revisar el despliegue automático de Vercel antes de modificar `main` y acordar el orden de migración y promoción.
3. Guardar el punto de recuperación de Neon y los identificadores del despliegue anterior. En la ventana aprobada, verificar el destino, ejecutar las migraciones aditivas y configurar las variables de producción. Mantener capacidades de escritura desactivadas hasta superar las comprobaciones de lectura y OAuth.
4. Promover el SHA validado. Repetir salud, descubrimiento, acceso del propietario y consulta de catálogo. Activar únicamente las capacidades aprobadas.
5. Si falla una comprobación, desactivar las escrituras y revertir el despliegue a la versión anterior. Conservar las tablas aditivas mientras sean compatibles. Cualquier restauración de base requiere revisar las escrituras posteriores al punto de recuperación y una decisión expresa.

## Resultados del 19 de noviembre de 2026

| Comprobación | Resultado |
| --- | --- |
| Pruebas locales | 9 aprobadas, incluidas descubrimiento OAuth, acceso del propietario, rechazo de JWT inválidos, aislamiento por entorno y llamada MCP de ficha audiovisual con token local. |
| Dependencias y compilación | Next.js actualizado de 16.4.3 a 16.4.6. `npm audit` informó 0 vulnerabilidades. TypeScript y build local correctos. |
| Neon, migración | 250 sentencias aditivas ejecutadas en la copia aislada. OAuth ya estaba presente. Se conservó el borrador social y el propietario preexistentes. |
| Neon, catálogo | 14 álbumes, 85 posiciones del catálogo y 0 publicaciones verificadas. El snapshot separado contiene 34 entradas y 543 posiciones. Las huellas del contenido y del manifiesto coincidieron con el origen. |
| Neon, borradores | Inserción y lectura SQL de ambos tipos en estado DRAFT, restricción audiovisual de estado y rollback comprobados. Recuentos persistentes de la copia tras migrar, 1 social y 0 audiovisuales. |
| Pendiente de aceptación | OAuth interactivo desde ChatGPT y lecturas/escrituras MCP con una base de Preview que use identidad y credenciales propias. |


## Validación adicional, 21 de noviembre de 2026

Preview aislado: proyecto Neon `snowy-heart-50323365`, rama `br-young-breeze-bhpg8ibv`, con identidad y credenciales propias. El código de integración validado para estas llamadas es `5760039a976b6a00dd233325ace424aa21f5bd0c`.

Tras habilitar el protocolo MCP 2025 y completar la autorización OAuth del propietario, el usuario ejecutó desde Codex las herramientas del servidor integrado. `workspace_status` confirmó las capacidades y la aprobación humana. `catalog_summary` devolvió 14 álbumes y 85 posiciones documentadas. `prepare_video_brief` devolvió la ficha de Golden Dust sin guardar, generar, programar ni publicar. `create_content_draft` y `list_content_drafts` guardaron y leyeron el mismo borrador de prueba en estado DRAFT. Una consulta independiente a la base aislada confirmó un borrador social y cero audiovisuales.

Pendientes: guardar y leer un borrador audiovisual mediante MCP, verificar los tres instrumentos de revisión del snapshot desde el mismo cliente, completar las pruebas negativas contra el Preview y validar la aplicación en ChatGPT. La prueba de OAuth en Codex no demuestra por sí sola la disponibilidad del complemento en ChatGPT. Excluir el borrador de prueba y todas las credenciales y sesiones del Preview de cualquier migración a producción.


### Prueba audiovisual y catálogo de revisión

El 21 de noviembre de 2026, el usuario ejecutó desde Codex y con OAuth del propietario `review_catalog_summary`, `save_video_production_draft` y `list_video_production_drafts`. El resumen devolvió 34 fichas y 543 posiciones observadas. El borrador de prueba de Golden Dust quedó en estado DRAFT y se leyó con el mismo identificador. La respuesta confirmó que no se subieron archivos, generaron medios, programaron ni publicaron contenidos. Una consulta de solo lectura a Neon confirmó un borrador social y uno audiovisual de prueba en el Preview aislado. Ambos quedan fuera de producción.

Quedan pendientes pruebas negativas contra el Preview, las consultas detalladas del catálogo de revisión y la ejecución de las herramientas a través del complemento de ChatGPT. Codex utiliza una conexión MCP configurada directamente y el resultado no demuestra que el complemento de ChatGPT haya cargado sus herramientas. El usuario inició sesión con una contraseña provisional. Hay que establecer una contraseña elegida por el propietario mediante un procedimiento seguro antes de usar la cuenta de forma continuada.
