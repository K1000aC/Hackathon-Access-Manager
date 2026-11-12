# Pruebas de interfaz con Playwright

Desde la raíz, con Node 24:

```sh
npm install
npx playwright install chromium firefox webkit
npm run test:e2e
npm run test:e2e:report
npm run test:auth
```

`playwright.config.ts` inicia una instancia aislada en el puerto 8445 con una URL de Supabase ficticia; los tests interceptan sus peticiones para probar las pantallas sin crear cuentas, equipos ni correos en producción. No reutiliza el Vite del usuario. Cada prueba tiene un navegador y datos independientes. No se usan credenciales reales.

## Cobertura actual

Se ejecutan seis casos en Chromium, Firefox, WebKit, Android emulado e iPhone emulado, para 30 ejecuciones:

1. Navegación y menú lateral desplegable, cierre con Escape y pantallas protegidas que requieren iniciar sesión.
2. Registro compartido después de iniciar sesión, restauración del equipo desde la API tras recargar y ausencia de escrituras a la antigua clave de equipos en localStorage. Las respuestas de Supabase se simulan en esta suite; las restricciones reales SQL se prueban con `npm test`.
3. RMP paso a paso, q3 neón, persistencia de la sesión educativa y separación entre simulador y plataforma.
4. RP ejecutado automáticamente, rechazo qerr, resaltado magenta y reinicio.
5. Cadena vacía y evento adicional RMPX.
6. Dashboard, nombres de las creadoras, CTA hacia registro, logo, barra lateral y ausencia de desbordamiento horizontal.

La consola usa el reportero list; el HTML se guarda en playwright-report. Fallos generan capturas, trazas y vídeos en test-results. Ambos directorios están ignorados por Git. La suite usa esperas de aserciones, sin pausas arbitrarias.

```sh
npm run test:e2e -- --project=chromium --headed
npm run test:e2e:ui
npm run typecheck:e2e
```

## Autenticación

`playwright.auth.config.ts` inicia otra instancia aislada en 8444. `npm run test:auth` comprueba recuperación recibida desde el arranque, restauración al recargar, guardado de contraseña, salida y nuevo acceso, enlaces expirados y límites del proveedor de correo. Son tres casos en Chromium y WebKit/iPhone, con Auth simulado y sin capturas o trazas de contraseñas.

## Prueba real

El flujo de cuentas reales de QA está documentado en docs/qa-live.md. Es opt-in porque escribe en el proyecto compartido. Las pruebas emuladas no sustituyen los dispositivos físicos ni la validación de SMTP, enlaces del correo y roles en Supabase real.

Referencias: https://playwright.dev/docs/test-webserver y https://playwright.dev/docs/test-projects.
