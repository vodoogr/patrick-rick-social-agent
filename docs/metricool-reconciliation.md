# Conciliación de calendario con Metricool

`reconcile_metricool_calendar` compara asociaciones explícitas entre borradores de una propuesta y observaciones proporcionadas por el conector Metricool. Verifica que borradores, plataformas y marca coincidan y rechaza asociaciones duplicadas. No busca publicaciones por título ni evita por sí sola que otro cliente programe duplicados.

El agente debe consultar Metricool inmediatamente antes y proporcionar los identificadores, fecha, estado, presencia de material y publicación automática observados. La herramienta no consulta Metricool ni verifica esos datos; no los guarda y su resultado puede quedar obsoleto. `PENDING` significa pendiente y no prueba publicación; consultar de nuevo para comprobar resultados. No cambiar `content_drafts.status` por una observación externa.

Solo opera en Preview con acceso a la base de datos. No crea, modifica, programa ni publica en Metricool. La programación real requiere la conexión Metricool y la autorización correspondiente del usuario; la decisión editorial sigue separada.

## Observaciones persistentes

La migración `database/metricool_observations.sql` guarda un vínculo por borrador y una última observación facilitada por el cliente. `save_metricool_observations` valida pertenencia a la propuesta, marca, red y unicidad; no permite cambiar de marca o UUID para un vínculo existente. El ID numérico de Metricool puede cambiar: el UUID estable identifica la publicación. `list_metricool_observations` devuelve lo último registrado, con hora y procedencia. Son datos históricos, no una consulta automática ni una verificación de contenido o derechos. Debe consultarse Metricool antes de actualizar o decidir; no existen historial completo, revocación automática ni detección universal de duplicados.
