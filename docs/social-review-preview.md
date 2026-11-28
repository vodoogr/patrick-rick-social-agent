# Revisión creativa en Preview

La migración `database/social_draft_reviews.sql` añade un historial de decisiones por borrador. Una decisión creativa no modifica `content_drafts.status`, no comprueba derechos ni versiones y no autoriza programación o publicación. No se han migrado decisiones de conversaciones anteriores.

`list_social_review_queue` devuelve hasta 100 borradores recientes con su última decisión y materiales. Los borradores sin decisión aparecen pendientes. Esta primera versión no tiene paginación ni asociación formal a una campaña; una interfaz futura debe explicitar estas limitaciones y no presentar esa lista como exhaustiva cuando llegue al límite.

`record_social_review` registra una decisión humana explícita con notas opcionales, solo en Preview y con la capacidad de escritura habilitada. Las notas pueden describir dudas pendientes; una aprobación creativa no implica que los archivos estén disponibles ni que los derechos o las versiones estén verificados. El historial no registra la identidad del revisor y el último registro prevalece; no se ofrece bloqueo de ediciones concurrentes.

La migración fue probada en la rama hija `review-queue-test-20261126` y aplicada al proyecto aislado Preview `snowy-heart-50323365`, rama `br-young-breeze-bhpg8ibv`, base `patrick_rick_db`. Esa rama es la predeterminada de ese proyecto; no se debe confundir con una garantía de que cualquier rama predeterminada sea segura. La prueba de decisión solo existe en la rama hija. Falta desplegar una versión Preview protegida, actualizar el complemento y verificar el flujo autenticado de extremo a extremo. No se han importado decisiones de chats anteriores.
