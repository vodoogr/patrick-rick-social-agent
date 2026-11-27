# Conciliación de calendario con Metricool

`reconcile_metricool_calendar` compara asociaciones explícitas entre borradores de una propuesta y observaciones proporcionadas por el conector Metricool. Verifica que borradores, plataformas y marca coincidan y rechaza asociaciones duplicadas. No busca publicaciones por título ni evita por sí sola que otro cliente programe duplicados.

El agente debe consultar Metricool inmediatamente antes y proporcionar los identificadores, fecha, estado, presencia de material y publicación automática observados. La herramienta no consulta Metricool ni verifica esos datos; no los guarda y su resultado puede quedar obsoleto. `PENDING` significa pendiente y no prueba publicación; consultar de nuevo para comprobar resultados. No cambiar `content_drafts.status` por una observación externa.

Solo opera en Preview con acceso a la base de datos. No crea, modifica, programa ni publica en Metricool. La programación real requiere la conexión Metricool y la autorización correspondiente del usuario; la decisión editorial sigue separada. Una futura sincronización persistente necesita procedencia, hora de observación, control de cambios, revocación y prevención de duplicados antes de implementarse.
