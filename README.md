# HackaFlow

Gestor de acceso para hackatones con React, TypeScript, Vite y Tailwind CSS. El AFD acepta exactamente `RMP` (Registro → Mentoría → Prototipo).

## Desarrollo

Requiere Node.js 24. Desde la raíz:

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

El servidor de desarrollo usa el puerto indicado por `PORT` o 8443. `npm run build` comprueba TypeScript y genera `frontend/dist`.

## Organización

- `frontend/src/app`: composición de la aplicación y navegación.
- `frontend/src/views/pages`: pantallas de acreditación, simulación, equipos y proyecto.
- `frontend/src/views/components`: componentes visuales reutilizables.
- `frontend/src/model`: AFD y tipos de dominio, independientes de React.
- `frontend/src/controller`: coordinación de acciones y estado de la interfaz.
- `frontend/src/infrastructure/storage`: adaptador de persistencia local.
- `frontend/src/styles`: estilos globales y paleta del producto.
- `frontend/public`: recursos estáticos.
- `frontend/tests`: pruebas del dominio.
- `backend`: migraciones PostgreSQL y permisos de la plataforma compartida; consulta su README.
- `docs`: arquitectura y decisiones del proyecto.

## Plataforma compartida

Mi panel incorpora cuentas de estudiante, asesor y organizador, envíos a revisión, observaciones, asignación de equipos y certificación tras aprobación. Requiere activar Supabase siguiendo `backend/README.md`. Sin esa configuración se puede seguir usando la demo local. Consulta `docs/platform.md` para el alcance y la compatibilidad móvil.

## Demostración local

Registro → guardar equipo → Equipos y seguimiento → seleccionar equipo → confirmar mentoría indicando sesión o mentor → entregar enlace HTTP/HTTPS al prototipo → certificación en q3. Los equipos pendientes, eventos y fechas se guardan desde el registro. La constancia final se puede imprimir o guardar como PDF desde el diálogo de impresión.

La mentoría y la entrega se confirman manualmente para la demo; no se comprueba asistencia externa ni contenido del repositorio. El simulador de Modelo AFD es educativo e independiente: sus cadenas no certifican equipos. Conserva la entrada, el progreso y las últimas 20 pruebas; al regresar se retoma pausado.

El almacenamiento usa `localStorage`, persiste al recargar y sincroniza equipos entre pestañas del mismo origen. No hay base de datos remota ni sincronización entre dispositivos. Los equipos aceptados en la versión anterior se conservan como registros importados sin evidencias. El pase de registro corresponde a q1; la constancia final solo aparece al completar RMP en q3.


## Despliegue

Importa el repositorio en Vercel con la raíz del repositorio como Root Directory. `vercel.json` configura la compilación, `frontend/dist` y el fallback de navegación de la SPA. El frontend funciona en el dominio asignado sin direcciones de servidor locales en el código.

## QA de interfaz

La suite de Playwright cubre navegación, registro y persistencia local, seguimiento y simulación AFD en escritorio, Android e iOS emulados. Instrucciones y cobertura en `docs/qa-e2e.md`.

```sh
npx playwright install chromium firefox webkit
npm run test:e2e
npm run test:e2e:report
```
