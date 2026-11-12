# Mi panel: subpestañas y trabajo del equipo

La barra interna aparece únicamente al iniciar sesión. Resumen permite abrir cada apartado desde sus indicadores. Mi perfil contiene la identidad de la cuenta; solo organización ve la tabla desplegable de usuarios, búsqueda, filtro y guardado explícito del rol. El rol propio no se puede cambiar. Los permisos de Supabase siguen determinando qué equipos y entregas ve cada persona.

- Estudiantes: Resumen, Mi equipo, Mis entregas, Backlog, Sprints, Certificados y Mi perfil.
- Asesores y organización: Resumen, Equipos, Por revisar, Backlog, Sprints, Certificados y Mi perfil. El asesor consulta sus equipos asignados; organización consulta el evento.
- Mis entregas / Por revisar conserva las entregas y aprobaciones M/P del acceso. Los certificados corresponden exclusivamente a RMP.
- Backlog y Sprints permiten guardar actividades en preparación, adjuntar evidencia y enviar a revisión. El asesor asignado o la organización aprueban o solicitan correcciones. El estudiante puede corregir borradores y trabajos devueltos, pero no modificar los pendientes o aprobados.

## Activación en Supabase

1. Abrir `backend/migrations/002_work_items.sql` y copiar su contenido completo.
2. En el proyecto HackaFlow de Supabase, abrir SQL Editor → New query, pegarlo y ejecutar Run. Requiere que `001_platform.sql` ya esté aplicada. Ejecutar **una sola vez**; si hay un error, conservar el texto para revisarlo antes de repetir.
3. Al aparecer `Success. No rows returned`, volver a Backlog o Sprints y pulsar Actualizar trabajo.

Esta migración añade `work_items`, dos funciones y un bucket privado `team-work`. No altera perfiles, equipos ni las aprobaciones existentes. Hasta aplicarla, los apartados nuevos muestran un aviso; el resto del panel continúa funcionando.

Los archivos admitidos son PDF, DOCX, XLSX, TXT, PNG, JPG/JPEG y ZIP de hasta 10 MB. Solo el propietario sube a la carpeta de su equipo. Solo propietario, asesor asignado y organización pueden descargar; el enlace de descarga caduca en 60 segundos. No hay permisos públicos. Las evidencias ya vinculadas no se pueden borrar directamente. Cambiar un adjunto conserva el anterior en el bucket para evitar pérdida de evidencia.

Backlog y sprints no modifican el AFD automáticamente: la aprobación de mentoría activa M y la del prototipo activa P. La sección educativa del AFD sigue independiente.

## Verificación

`npm test` ejecuta PostgreSQL local (PGlite), incluidas las políticas de acceso, archivos y las revisiones. `npx playwright test frontend/e2e/panel.spec.ts --project=chromium --project=ios --workers=1` verifica la interfaz con un backend simulado, sin modificar cuentas del evento.
