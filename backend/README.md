# Backend

Directorio preparado para una futura API. Actualmente no hay servidor ejecutable ni dependencias de backend: la demostración utiliza almacenamiento local en el frontend.

Estructura prevista:

- `src/routes`: rutas HTTP y conexión con controladores.
- `src/controllers`: validación del contrato HTTP y respuestas.
- `src/services`: casos de uso, validación de equipos y coordinación del dominio.
- `src/repositories`: acceso a una futura base de datos.
- `tests`: pruebas de API e integración cuando exista el servidor.

Antes de implementar la API se deben definir persistencia, autenticación y despliegue. La regla de aceptación sigue siendo finalizar en q3 con la cadena RMP; debe verificarse también en el servidor. El adaptador `frontend/src/infrastructure/storage` podrá sustituirse por un cliente HTTP desde los controladores sin modificar los componentes visuales.
