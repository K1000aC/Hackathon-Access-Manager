# Gestión, entregas y certificado de finalización

Activar una vez el contenido completo de `backend/migrations/005_project_deliveries.sql` desde Supabase SQL Editor. Requiere las migraciones 001, 002 y 004; es compatible con 003. No volver a ejecutar las anteriores.

## Backlog / Sprints

Una sola pestaña reúne el tablero externo (GitHub Projects, Trello u otro), el repositorio y un resumen redactado por el líder: actividades planeadas, en curso, terminadas y objetivos del sprint. Ambos enlaces son HTTPS y deben ser públicos, accesibles sin sesión.

El líder confirma esa condición al compartirlos. El asesor asignado abre ambos enlaces y valida su visibilidad o solicita correcciones. La etiqueta distingue **pendiente de revisión** de **enlaces públicos validados**. No se anuncia una validación automática ni se importa contenido de plataformas privadas. La comprobación corresponde al momento de revisión; no monitoriza cambios posteriores de privacidad en la plataforma externa. Modificar los enlaces o el resumen anula la validación anterior y requiere revisarlos de nuevo.

Las actividades anteriores de Backlog y Sprints se conservan en un apartado de consulta, sin pérdida de información.

## Mis entregas / Por revisar

El líder puede crear nuevas entregas o tareas, describir objetivos, compartir enlaces y adjuntar archivos. Se admiten PDF, DOCX y PPTX, junto con los formatos previos del módulo, hasta 10 MB. Los archivos siguen siendo privados para el equipo, su asesor y organización. Los integrantes pueden consultar; el líder crea o corrige envíos. Asesores revisan sus equipos y organización conserva el seguimiento general.

Las tareas no cambian automáticamente el AFD. Las secciones de mentoría y propuesta final conservan las aprobaciones M/P. Esas etapas también aceptan PDF, DOCX o PPTX; el prototipo final puede enviarse como archivo o como enlace. Un archivo vinculado a una entrega no se puede borrar directamente mediante la API de Storage.

## Certificado de finalización

Se muestra únicamente si el equipo tiene RMP, una calificación final (0–100) y el asesor revisor registrado. La aprobación del prototipo exige la nota del asesor asignado en la misma operación. Organización no sustituye esa calificación. No hay un umbral mínimo nuevo: el asesor decide la aprobación y registra la puntuación.

El certificado acredita entrega, revisión, aprobación y calificación de la propuesta final; muestra la nota, fecha y folio del equipo y permite imprimir/guardar PDF. Las tareas auxiliares no generan certificados.

Los proyectos anteriores en RMP sin nota conservan su historial y estado del AFD, pero aparecen como **entrega final pendiente de calificación** en Equipos. El asesor asignado puede registrar esa nota para emitir el certificado, siempre que exista una entrega P aprobada. No se inventan calificaciones ni se sobreescriben las observaciones anteriores.

La base contiene `project_management`, `submissions.attachment_path` y los campos finales de nota/revisor/fecha/observaciones en `event_teams`. Las funciones antiguas siguen siendo compatibles para M; la aprobación de P exige la nueva calificación. La función interna de revisión anterior pierde permisos para usuarios autenticados, para impedir saltarse esa exigencia.

## Pruebas

`npm test` verifica políticas, archivos, tareas, notas y revisión final con PostgreSQL local. Playwright cubre gestión y PPTX (`panel.spec.ts`), validación del asesor, propuesta PDF y certificado condicionado a la nota (`deliveries.spec.ts`). Los navegadores usan respuestas simuladas, sin modificar datos del evento.
