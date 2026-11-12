# HackaFlow

Aplicación React + TypeScript + Vite + Tailwind CSS v4.

## Estructura

- `frontend/src/app/App.tsx`: composición y navegación.
- `frontend/src/main.tsx`: entrada de React.
- `frontend/src/views/pages`: pantallas.
- `frontend/src/views/components`: componentes visuales.
- `frontend/src/model`: dominio y AFD.
- `frontend/src/controller`: coordinación y hooks.
- `frontend/src/infrastructure/storage`: persistencia local.
- `frontend/src/styles/index.css`: estilos globales.
- `frontend/tests`: pruebas.
- `backend`: backend Supabase con migraciones PostgreSQL y permisos RLS.
- `docs/architecture.md`: decisiones de arquitectura.
- `docs/platform.md`: roles, flujo compartido y compatibilidad.

## Comandos desde la raíz

`npm run dev`, `npm run typecheck`, `npm test`, `npm run build`, `npm run preview`, `npm run format`.

No iniciar un servidor adicional si ya hay uno en ejecución. Vite usa `PORT` o 8443. La compilación produce `frontend/dist` y debe pasar la comprobación TypeScript.

## Convenciones

Mantener las reglas del AFD en el modelo y el acceso a almacenamiento en infraestructura. Coordinar las operaciones desde los controladores; separar páginas de componentes reutilizables.

Tailwind v4 se importa desde la hoja global. Mantener los `@import` al principio y los estilos globales de elementos en `@layer base` para que las utilidades puedan sobrescribirlos.

Paleta: fondo #2B054E, violeta #7B1FA2, acentos #C2185B, paneles #1A0033 y texto #FFFFFF.
