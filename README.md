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

Mi panel incorpora cuentas de estudiante, asesor y organizador, envíos a revisión, observaciones, asignación de equipos y certificación tras aprobación. Requiere activar Supabase siguiendo `backend/README.md`. Sin esa configuración las pantallas operativas indican que falta la conexión; el simulador educativo permanece disponible. Consulta `docs/platform.md` para el alcance y la compatibilidad móvil.

## Registro y seguimiento

Inicio presenta el proyecto y sus creadoras. Registro requiere una cuenta de estudiante y guarda el equipo en Supabase. Seguimiento muestra los equipos y entregas que cada rol puede consultar. Los asesores aprueban o solicitan correcciones; solo las aprobaciones completan R → RM → RMP. Mi panel permite iniciar sesión y administrar roles y asignaciones según el perfil.

No hay un modo operativo alternativo en localStorage. Los registros antiguos permanecen en el navegador sin importarse automáticamente a la base. El simulador educativo sigue siendo independiente y conserva sus cadenas en el navegador; no certifica equipos.

## Despliegue

Importa el repositorio en Vercel con la raíz del repositorio como Root Directory. `vercel.json` configura la compilación, `frontend/dist` y el fallback de navegación de la SPA. El frontend funciona en el dominio asignado sin direcciones de servidor locales en el código.

## QA de interfaz

La suite de Playwright cubre navegación, registro compartido con API simulada, seguimiento y simulación AFD en escritorio, Android e iOS emulados. Instrucciones y cobertura en `docs/qa-e2e.md`.

```sh
npx playwright install chromium firefox webkit
npm run test:e2e
npm run test:e2e:report
```

La portada Inicio presenta el proyecto, la visión, la proyección y la acreditación del evento. El registro tiene una pantalla separada. La navegación lateral permanece visible en escritorio y se abre como menú en pantallas pequeñas; el fondo animado respeta movimiento reducido.
