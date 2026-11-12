# Pruebas de interfaz con Playwright

La suite usa navegadores reales para hacer clic, completar formularios, navegar y comprobar la persistencia después de recargar. Cubre la demo local y el simulador educativo, sin crear usuarios ni escribir en Supabase. Cada prueba tiene un contexto de navegador aislado, sin datos precargados ni credenciales.

## Estructura

```text
playwright.config.ts                 # Servidor, proyectos y reportes
frontend/e2e/fixtures.ts             # Navegación, registro y captura de errores JS
frontend/e2e/hackaflow.spec.ts        # Casos end-to-end y aserciones visuales
frontend/e2e/tsconfig.json           # Comprobación TypeScript de QA
playwright-report/                  # Reporte HTML generado, ignorado en Git
test-results/                       # Evidencias de fallos, ignoradas en Git
```

## Ejecutar desde la raíz

Con Node.js 24 y las dependencias del proyecto:

```sh
npm install
npx playwright install chromium firefox webkit
npm run test:e2e
```

La configuración reutiliza Vite en `http://localhost:8443` si ya está ejecutándose; si no, lo inicia y lo detiene al finalizar. No hace falta usar Go Live ni abrir HTML con file://. En CI no se reutiliza un servidor existente. En Linux, puede ser necesario instalar las dependencias del sistema con `npx playwright install --with-deps`.

Para una comprobación rápida en escritorio:

```sh
npm run test:e2e -- --project=chromium
```

Para observar el navegador o usar el modo interactivo:

```sh
npm run test:e2e -- --project=chromium --headed
npm run test:e2e:ui
```

Para revisar el reporte y comprobar tipos:

```sh
npm run test:e2e:report
npm run typecheck:e2e
```

## Cobertura

1. Navegación entre inicio, registro local, seguimiento, proyecto y Modelo AFD; presencia de quíntupla y tabla.
2. Campos obligatorios, registro por formulario, pase q1, almacenamiento y restauración después de recargar; rechazo de nombres duplicados.
3. Confirmación de mentoría, entrega de enlace, persistencia intermedia y constancia únicamente después de RMP.
4. Entrada `R M P`, normalización a RMP, pasos q0 → q1 → q2 → q3, doble estado de aceptación, borde magenta, texto blanco y resplandor. Persistencia del simulador sin certificar equipos.
5. Entrada `R P`, ejecución automática, rechazo qerr, alerta visual magenta, historial y reinicio a q0.
6. Portada con visión y proyección, registro separado, navegación lateral y ausencia de desbordamiento horizontal.
7. Cadena vacía con controles deshabilitados y `RMPX`, que no debe aceptarse aunque transite temporalmente por q3.

Se ejecutan los siete casos en cinco proyectos: Chromium, Firefox, WebKit, Android (Chromium con perfil Pixel 7) e iOS (WebKit con perfil iPhone 13): 35 ejecuciones. Los perfiles móviles simulan pantalla, entrada táctil y agente de usuario; no sustituyen pruebas físicas en teléfonos ni prueban una aplicación nativa.

La suite usa aserciones con espera automática, sin pausas fijas. No compara capturas con una referencia visual: comprueba estilos CSS concretos del diseño neón. Las clases se consultan únicamente para estados/estilos; las interacciones usan roles y etiquetas accesibles.

## Reportes y diagnóstico

La consola muestra cada caso con su resultado y un resumen; el comando devuelve un código distinto de cero si falla una prueba. El reporte HTML conserva el detalle por navegador. Ante fallos se guardan capturas, vídeo y trazas en `test-results`. Las excepciones JavaScript no controladas también hacen fallar el caso. Abre la traza desde el reporte HTML para ver las acciones y el DOM de cada paso.

Si necesitas probar otra instancia, puedes indicar una URL explícita. En ese caso Playwright no inicia ningún servidor:

```sh
E2E_BASE_URL=http://localhost:9000 npm run test:e2e -- --project=chromium
```

La portada inicial es Inicio: se comprueban el dashboard, el CTA de registro, el logo y la navegación lateral. El contenido de Mi panel puede ser el formulario de acceso o el aviso de configuración pendiente. Esta suite no verifica autenticación, correos, aprobación por asesor ni RLS en una instancia real de Supabase. Las pruebas PostgreSQL y del modelo se ejecutan por separado con `npm test`.

Referencia: [servidor de pruebas](https://playwright.dev/docs/test-webserver), [proyectos y dispositivos](https://playwright.dev/docs/test-projects), [reportes](https://playwright.dev/docs/test-reporters).
