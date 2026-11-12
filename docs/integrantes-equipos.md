# Líderes, integrantes y profesor asignado

Ejecutar una vez `backend/migrations/004_team_members.sql` en SQL Editor. Requiere 001; se recomienda completar 002 y 003 antes para que las evidencias y los tipos de usuario estén actualizados. No volver a ejecutar las migraciones anteriores.

El registro público crea estudiantes. Para generar un acceso hay que iniciar sesión; la cuenta que registra es el líder (`owner_id`). Durante el registro, el líder elige el cupo total (incluyéndose) y puede introducir correos de estudiantes con cuenta confirmada. La operación asigna automáticamente el asesor con menos equipos. Si no hay asesores, no se crea el equipo. Organización mantiene su control de reasignación.

El líder queda activo inmediatamente. Los demás correos generan solicitudes pendientes. Solo el profesor asignado puede aprobar o rechazar incorporaciones y retiros. El líder solicita los cambios desde Personas del equipo; los miembros no tienen controles de modificación. El líder no se puede retirar; no hay transferencia de liderazgo en esta versión. La organización puede consultar las solicitudes, pero su aprobación corresponde al asesor.

La base comprueba cuenta confirmada, tipo estudiante, cupo, unicidad y permisos. Una solicitud de incorporación reserva a ese estudiante para evitar solicitudes simultáneas de varios equipos. Al aprobar, se vuelve a validar y se actualiza el número real de miembros. Un rechazo libera la reserva. Un miembro activo no puede registrar otro equipo ni pertenecer a dos equipos. Los estudiantes sin equipo que tengan una incorporación pendiente deben pedir que el asesor la resuelva antes de crear otro acceso.

**Al aplicar a datos anteriores:** los representantes se convierten en líderes, los números anteriores se conservan como cupo y los integrantes activos se recalculan a partir de cuentas reales (inicialmente solo el líder). No se inventan cuentas para completar una cifra. Los equipos sin profesor reciben uno automáticamente si hay asesores disponibles. No se modifican cadenas ni certificaciones anteriores.

Los miembros ven el equipo, sus revisiones y evidencias. El envío de etapas y el guardado de backlog/sprints siguen a cargo del líder; el backend ya comprobaba el propietario. La pertenencia no cambia R/M/P ni aprueba actividades.

La versión actual maneja **un evento**. La unicidad de estudiante en `team_members` es global para ese evento; no se presenta como soporte de múltiples hackatones. Al añadir múltiples eventos deberá convertirse en unicidad `(event_id, student_id)` junto con el resto del modelo de eventos.

Verificación: `node --test backend/tests/team-members.test.mjs` ejecuta las reglas con PostgreSQL local (PGlite), sin modificar los equipos reales.
