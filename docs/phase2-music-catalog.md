# Phase 2 — Catalogo musical canonico (Patrick Rick Agent AI)

**Estado:** validado solo en rama aislada de Neon. **Produccion no migrada**.

## Fuentes y fidelidad
- Se han revisado los 14 PDF adjuntos: 1 guia maestra y 13 biblias de album.
- Se importan 13 albumes, 14 discos y 85 posiciones de pista documentadas por los PDF.
- `ALMOST`, `UNFOLD`, `QUASI`, `MIDNIGHT FREQUENCIES`, catalogo italiano y futuros discos: **pendientes de fuentes actuales**; no se inventa tracklist ni estado publicado.
- Estado de lanzamiento, ISRC/UPC, fechas, audio/masterizacion, distribuidor y derechos: **UNKNOWN/NULL** hasta confirmacion documentada.
- Titulos coincidentes de los discos RED/PURPLE se almacenan como posiciones y composiciones separadas; no se presupone mismo master, grabacion o composicion sin identificacion validada.
- Toda fila canonica conserva `source_key`; PDF identificado por SHA-256. Los artistas Chris Rick / Patrick meets Rico proceden del contexto del proyecto, con fuente distinta a la biblia principal.
- El orden de pistas sin numeracion de RED/GREEN se conserva segun orden del listado visible en las biblias; no supone un lanzamiento.

## Diseño
- `catalog.sources`: procedencia, hashes.
- `catalog.artists`: identidades artisticas.
- `catalog.eras`: 4 eras principales.
- `catalog.albums`, `catalog.discs`, `catalog.album_tracks`: ubicacion canonica.
- `catalog.songs`: entradas documentales de composiciones; claves individuales por album hasta validar identidad cross-album.
- `catalog.recordings`: versiones studio/live/acoustic/unplugged/remix independientes de la composicion.
- `catalog.releases`: single/EP/album y metadatos del distribuidor, con estado por verificar.
- `catalog.assets`: referencias a material y control de derechos.
- `catalog.change_events`: registro para cambios futuros (las inserciones iniciales aun no generan eventos automaticos).

## Validacion ya realizada
Entorno: `phase2/catalog-validation` (`br-ancient-hill-b9o9k7e7`) derivado de Neon Preview.
- Schema: 15 sentencias SQL transaccionales aplicadas.
- Seed: 219 INSERT idempotentes aplicados como transaccion.
- Registros: 15 fuentes; 3 artistas; 4 eras; 13 albumes; 14 discos; 85 canciones documentales; 85 posiciones.
- Integridad: 0 pistas sin composicion, 0 registros de `recordings`, 0 registros de `releases`, 0 estados de lanzamiento inventados.
- Titulos compartidos: `Closer Than Touch`, `Quiet Heat`, `Slow Fire Between Us`, `We Don’t Have to Say It`, sin fusion automatica.
- CI: tests, TypeScript, Next.js build OK en PR #2.

## Pruebas MCP preparadas
- `catalog_summary`: solo lectura, resuelve conteos y eras.
- `list_catalog_albums`: filtra artista/era, limita 50.
- `get_catalog_album_tracks`: clave de album validada, devuelve pistas y source_key.
Todas usan OAuth `mcp:tools`; no se añaden endpoints de escritura ni se habilita programar/publicar.

## Pasos para promover
1. Revisar PR #2 y resultado CI; confirmar fuentes actuales para albumes `ALMOST`, `UNFOLD` y otros no incluidos en los PDF.
2. Aplicar schema y seed a la rama Neon Preview normal mediante transaccion y validar conteos.
3. Desplegar la rama Phase 2 apuntando **solo** a la base Preview y validar el flujo OAuth `catalog_*` con propietario.
4. Tras aceptacion, aplicar schema + seed a Neon Production. No copiar sesiones ni reiniciar datos.
5. Desplegar codigo aprobado para Production, verificar 3 herramientas anteriores + 3 nuevas, comprobar permisos.
6. Solo despues conectar la actualizacion del plugin privado. Mantener publicaciones bloqueadas.

**Nota:** PDF y biblia conceptual no certifican existencia en Spotify, SUNO, discografia publicada ni estado de distribucion.
