# Backend de HackaFlow

El backend utiliza Supabase Auth y PostgreSQL. Las tablas, políticas de acceso y operaciones transaccionales están en `migrations/001_platform.sql`. El frontend usa la clave pública y la sesión de usuario; los permisos se aplican en la base de datos, no solo en la interfaz.

## Alcance inicial

Un evento y una cuenta representante por equipo. Cada equipo tiene un asesor asignado. No hay invitaciones de integrantes, múltiples eventos, subida de archivos binarios ni comprobación externa de enlaces. Las entregas de prototipo usan enlaces HTTP/HTTPS. El registro confirma R; las aprobaciones de mentoría y prototipo confirman M y P.

Los datos locales de la demostración no se envían a la nube ni se convierten en aprobaciones de profesores.

## Puesta en marcha

1. Crea un proyecto Supabase y ejecuta `migrations/001_platform.sql` una vez en SQL Editor, antes de registrar cuentas.
2. En Auth, habilita correo/contraseña, confirmación de correo y configura Site URL con el dominio de Vercel. Incluye ese dominio y la URL local de desarrollo en las redirecciones permitidas, además de `https://hackathon-access-manager.vercel.app/?flow=recovery` y `http://localhost:8443/?flow=recovery` para recuperación.
3. Copia `frontend/.env.example` a `frontend/.env.local`. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la URL y la clave pública anon o publishable. No uses claves secretas ni service_role en el frontend.
4. Añade esas dos variables en Vercel y vuelve a desplegar. Vite las incorpora durante la compilación. En desarrollo reinicia Vite después de configurar el entorno.
5. Registra la cuenta del organizador desde la aplicación y confirma su correo. Con acceso administrativo al SQL Editor, asigna el primer organizador usando su correo real:

```sql
update public.profiles set role = 'organizer' where email = 'TU_CORREO_CONFIRMADO';
```

6. Los asesores crean sus cuentas. El organizador les asigna el rol desde Administrar usuarios y roles, y luego los asigna a equipos.
7. Usa cuentas distintas para estudiante, asesor y organizador. Comprueba el flujo de entrega, correcciones, reenvío, aprobación y certificación desde dos navegadores o dispositivos.

## Permisos

- Los registros de Auth siempre crean perfiles de estudiante; el rol no se toma de los metadatos enviados por el usuario.
- Estudiante: lectura de su equipo y envíos; solo puede registrar su equipo y enviar la próxima etapa.
- Asesor: lectura y revisión de equipos asignados.
- Organizador: consulta global, roles, asignaciones y revisión.
- No se permiten escrituras directas a las tablas desde clientes autenticados. Las funciones verifican el rol y bloquean filas para impedir aprobaciones duplicadas o avances fuera de orden.
- Solicitar correcciones exige observaciones y no modifica el AFD. Aprobar añade un evento con fecha y responsable, y avanza R → RM → RMP de forma atómica.

`npm test` ejecuta también pruebas PostgreSQL embebidas de las políticas y funciones. Estas pruebas no sustituyen la validación de correo, sesión y configuración de un proyecto real de Supabase.
