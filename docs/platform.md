# Plataforma compartida y compatibilidad

HackaFlow conserva la demostración local y el simulador académico; añade una plataforma compartida independiente con autenticación y tres roles. Los registros locales siguen disponibles y se identifican como demo. No se importan automáticamente como evidencia académica aprobada.

## Paneles

El estudiante representante registra su equipo, describe la mentoría y entrega el enlace al prototipo. Cada envío queda pendiente. Un asesor asignado o el organizador aprueba o solicita correcciones. Solo la aprobación actualiza el AFD, dentro de una transacción de base de datos. Los envíos y observaciones permanecen visibles como historial, también después de un reenvío.

El organizador puede asignar roles y asesores. Las cuentas que ya representan un equipo no se convierten en asesores; se usan cuentas distintas. El asesor ve únicamente los equipos asignados. Las políticas SQL siguen aplicándose aunque alguien llame directamente a la API.

La interfaz recarga los datos cada 15 segundos mientras está visible y al recuperar el foco. Existe un botón Actualizar. No se ha habilitado una suscripción Realtime; la revisión de decisiones obsoletas se bloquea igualmente en el servidor.

## Móvil y escritorio

Una aplicación web responsive permite acceder por HTTPS desde Safari en iOS, Chrome en Android y navegadores de escritorio modernos, sin instalar una aplicación nativa. En celular los formularios y el seguimiento se apilan en una columna, los controles tienen altura mínima de 48 px y las entradas usan 16 px. En escritorio aparecen indicadores y una lista lateral de equipos. Las animaciones respetan la preferencia de movimiento reducido.

No se promete compatibilidad con cualquier versión antigua de navegador. Aún hace falta comprobar el flujo completo en dispositivos iOS y Android reales. La instalación como PWA, las notificaciones push y el modo offline son ampliaciones futuras; los cambios compartidos requieren conexión.

## Activación y verificación

La configuración está en `backend/README.md`. Sin variables de Supabase, Mi panel explica que la plataforma no está conectada y mantiene disponible la demo local. No se simula una sesión autenticada ni se guardan contraseñas en el repositorio.

Antes de publicar: aplicar migración, configurar redirecciones de correo, crear el organizador y probar cuentas de cada rol en un proyecto Supabase real. Confirmar que los datos de un estudiante no aparecen a otro, que los asesores no asignados no pueden aprobar, y que una corrección no hace avanzar el AFD.
