# Cuentas de prueba sin confirmación de correo

El script crea 15 cuentas reales en Supabase Auth: 10 estudiantes y 5 asesores. Cada cuenta tiene una contraseña aleatoria y su perfil correspondiente. Usa la API administrativa con `email_confirm: true` solo para ese lote, sin desactivar la confirmación del registro público. Tu organizador actual se conserva. No se crean equipos ni se aprueban etapas automáticamente.

## Ejecutar

1. En Supabase → Settings → API Keys, copia una clave administrativa secret (o service_role en las claves antiguas).
2. En VS Code abre `backend/.env.qa.local`, ya preparado localmente, y pega la clave únicamente en `SUPABASE_ADMIN_KEY`. No la pongas en variables `VITE_`, en Vercel ni en el chat. El archivo está ignorado por Git.
3. Desde la raíz ejecuta:

```sh
npm run seed:qa
```

4. Abre `backend/.local/qa-users.json` para consultar correo, contraseña y rol. Es un archivo privado, excluido de Git; no lo compartas en la exposición. La consola muestra el resumen sin contraseñas.
5. Refresca Authentication → Users en Supabase. Entra en HackaFlow con una cuenta de estudiante y otra de asesor desde navegadores o dispositivos diferentes. Los correos de ejemplo no tienen buzón: no necesitan recibir mensajes para iniciar sesión porque ya se crean confirmados.
6. Con tu cuenta organizadora asigna los asesores a los equipos que registren los estudiantes.

Se usan `hackaflow.qa.student01@example.com` hasta `student10` y `hackaflow.qa.advisor01@example.com` hasta `advisor05`. El rol Supabase Auth continúa siendo `authenticated`; el rol de HackaFlow está en `public.profiles.role`.

El archivo de accesos se guarda antes de crear usuarios y después de cada avance. Si se interrumpe la ejecución, conserva ese archivo y vuelve a ejecutar el comando. El script reconoce su propio lote y no duplica cuentas ni restablece contraseñas. Si encuentra una cuenta del mismo correo ajena al lote, se detiene sin modificarla. No se elimina ninguna cuenta existente.

La plantilla de correos de registro se puede diseñar después de validar el flujo; este script no cambia el correo ni su configuración.

Referencia: [API administrativa createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser).

## QA autenticado en producción

El script `backend/scripts/qa-live-flow.mjs` ejecuta el recorrido real con student01 y advisor01. Es opt-in: no forma parte de `npm test` ni de `npm run test:e2e` porque crea entregas y aprobaciones en el proyecto compartido.

```sh
node --env-file=backend/.env.qa.local backend/scripts/qa-live-flow.mjs
```

Usa la cuenta administrativa solo para preparar la asignación del equipo QA; el registro, envíos, correcciones y aprobaciones se realizan con sesiones de estudiante y asesor en navegador. No prueba la interfaz de asignación de la organizadora. El estudiante usa Chromium con pantalla móvil y el asesor Chromium de escritorio; no son dispositivos físicos.

La ejecución del 12 de noviembre de 2026 completó registro → mentoría pendiente → correcciones → reenvío → aprobación → prototipo pendiente → aprobación → certificación q3. Conservó el historial y verificó la constancia después de recargar. Usa una URL ficticia de example.com para la entrega de QA.

Resultados privados: `backend/.local/qa-live-report.json` y `backend/.local/qa-live-certified.png`. No se guardan trazas ni vídeos de inicio de sesión. El script conserva datos existentes: si el equipo ya avanzó, se detiene y no lo reinicia. Por tanto, una vez completado el recorrido, no se debe esperar que repetir el comando vuelva a realizar las etapas desde cero.
