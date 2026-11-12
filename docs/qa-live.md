# QA de la plataforma publicada

Se verificó el flujo real de `https://hackathon-access-manager.vercel.app` con las cuentas de prueba Estudiante QA 01 y Asesor QA 01. La ejecución usa Chromium con dos contextos independientes: estudiante con pantalla táctil móvil y asesor en escritorio.

## Resultado

- Inicio de sesión de ambas cuentas correcto.
- Registro del equipo desde el formulario del estudiante, persistido con cadena R.
- Asignación del asesor preparada por la API administrativa únicamente para el equipo QA 01. No se probó el control de asignación de la interfaz de organizadora.
- Envío de mentoría pendiente: conserva R y el estudiante no tiene botones de aprobación.
- Asesor consulta su equipo asignado, solicita correcciones y deja observaciones; el equipo conserva R.
- Estudiante reenvía la descripción corregida; aprobación del asesor avanza a RM.
- Envío de prototipo conserva RM hasta su aprobación; aprobación avanza a RMP.
- Constancia final visible después de recargar y diagrama con q3 activo.
- Base de datos conserva tres entregas: mentoría con correcciones, mentoría aprobada y prototipo aprobado; eventos R/M/P con el asesor responsable de M y P.

Se conserva el equipo certificado como dato de demostración. El enlace `https://example.com/hackaflow-qa-prototipo` es evidencia ficticia de QA; no se evaluó un prototipo externo.

## Ejecución opt-in

```sh
node --env-file=backend/.env.qa.local backend/scripts/qa-live-flow.mjs
```

Esta ejecución cambia datos reales de las cuentas QA 01. No forma parte de `npm test` ni `npm run test:e2e`, no borra ni reinicia equipos y se detiene si el equipo ya tiene progreso previo. Por lo tanto, después de esta ejecución satisfactoria una segunda ejecución se detendrá al encontrar el equipo ya certificado.

El script lee las credenciales privadas ya generadas, no las imprime y no guarda trazas ni vídeos de inicio de sesión. Guarda un reporte sin claves ni contraseñas y una captura del panel certificado en `backend/.local/`, excluido de Git. El archivo de usuarios QA y el archivo de entorno no se modifican.

## Límites

No se probó la sesión de organizadora ni el aislamiento entre dos equipos distintos ya existentes. La lista del asesor coincidió con su única asignación. Las políticas de aislamiento entre cuentas se cubren también con las pruebas PostgreSQL del repositorio. La emulación móvil no sustituye pruebas físicas en iOS y Android.
