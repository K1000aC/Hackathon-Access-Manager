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
