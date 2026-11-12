# Diagnóstico de acceso y recuperación

El error invalid_credentials significa que Supabase no acepta la combinación de correo y contraseña; no demuestra que la cuenta no exista. Los enlaces de confirmación o recuperación pueden iniciar una sesión sin validar la contraseña escrita en el formulario.

La aplicación escucha los enlaces desde el arranque, muestra el formulario de nueva contraseña y cierra la sesión temporal al guardar. El botón Mostrar contraseña permite revisar un valor autocompletado sin enviarlo a logs.

La solicitud de correo muestra códigos de Supabase y mensajes distintos para restricciones del proveedor, límites de envío, errores de conexión y fallos del servicio. Un error antes de enviar el correo no puede resolverse cambiando la redirección de la aplicación. Debe revisarse Auth → Logs y la configuración de correo del proyecto.

El proveedor de correo incorporado tiene límites bajos y restricciones de destinatarios. Configurar SMTP es necesario para un uso sostenido. No se ha confirmado que sea la causa específica del error de la cuenta de la organizadora: el mensaje anterior ocultaba el detalle.

Para recuperar una cuenta propia administrativamente sin enviar correo:

```sh
node --env-file=backend/.env.qa.local backend/scripts/recovery-link.mjs correo-de-la-cuenta
```

El script genera un enlace de recuperación con la API administrativa y lo guarda en backend/.local/recover-account.html, ignorado por Git. No envía mensajes ni cambia la contraseña automáticamente. Abrir ese archivo en el navegador y pulsar el enlace permite a la titular elegir una contraseña nueva. Es privado, temporal y de un solo uso; no debe compartirse, publicarse ni adjuntarse en capturas. La clave administrativa permanece únicamente en el entorno backend local.

Después de publicar las correcciones: confirmar que la URL /?flow=recovery esté permitida en Supabase, guardar una nueva contraseña y probar inicio de sesión sin enlaces. Si falla el envío, conservar el código visible para distinguir una restricción SMTP de un límite de solicitudes.

Referencias: https://supabase.com/docs/guides/auth/auth-smtp y https://supabase.com/docs/guides/auth/debugging/error-codes.
