# Tipos de usuario y altas autorizadas

El único campo de permisos es `public.profiles.role`. Existen exactamente tres valores:

| Valor | Tipo | Alta y permisos |
| --- | --- | --- |
| student | Estudiante | Único tipo del registro público. Crea el acceso de su equipo y envía entregas. |
| advisor | Asesor | Organización asigna el tipo desde su administración o un desarrollador lo provisiona con acceso administrativo. Revisa exclusivamente los equipos asignados. |
| organizer | Organizador | Alta administrativa o asignación por organización autorizada. Administra usuarios, tipos, asignaciones y el evento. |

El registro público ignora cualquier `role`, origen o responsable enviado en `raw_user_meta_data`. La base fija el tipo inicial a `student`. Ningún estudiante o asesor puede elevar sus permisos; tampoco hay escrituras directas de perfiles para usuarios autenticados. La organización usa `set_user_role`; la función bloquea cambiar el rol propio y romper asignaciones o equipos existentes. Las operaciones administrativas usan una clave privada en backend, nunca en el frontend.

Supabase Auth utiliza su propio rol técnico `authenticated`. El tipo del usuario de HackaFlow se consulta en `profiles.role`, y se muestra como **Tipo de usuario** en la interfaz. No hay un segundo campo de permisos que pueda contradecirlo.

## Campos de trazabilidad

La migración `backend/migrations/003_user_types.sql` añade:

- `role_source`: `public_signup` (tipo inicial del registro), `organizer` (asignado por organización), `developer` (asignación administrativa) o `legacy` (origen histórico desconocido).
- `role_assigned_by`: UUID de organización cuando cambia el tipo; vacío para una operación administrativa o datos anteriores sin responsable conocido.

El trigger de base de datos marca los cambios. Modificar el nombre o correo no altera ese rastro. La marca describe la **asignación actual del tipo**, no un historial completo de todas sus modificaciones. Los lotes QA reconocidos por metadatos administrativos se identifican como administrativos. Los demás datos históricos conservan `legacy` para no inventar su origen.

## Activar

En Supabase SQL Editor, ejecutar una vez el contenido completo de `003_user_types.sql`. Requiere la migración 001 ya aplicada; es independiente de la 002 de Backlog y Sprints. Después refrescar Mi panel → Mi perfil. Hasta aplicarla, los tipos actuales siguen funcionando y la interfaz muestra el origen como registro anterior.
