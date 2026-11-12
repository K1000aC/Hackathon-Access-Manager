# Arquitectura

El frontend mantiene MVC dentro de una separación por responsabilidades:

1. La vista presenta datos y emite acciones.
2. Los controladores coordinan la simulación y el repositorio de equipos.
3. El modelo define el AFD, sus transiciones y los tipos de equipo.
4. La infraestructura implementa la persistencia del navegador y las notificaciones de cambio.

`app/App.tsx` compone las pantallas y la navegación. El modelo del AFD no depende del navegador. El repositorio guarda equipos y eventos en `hackaflow.teams.v2`, e importa los aceptados de `hackaflow.accepted.v1` sin atribuirles evidencias nuevas. El modelo de equipo verifica el orden de etapas. La selección usa `hackaflow.selectedTeam`; el simulador conserva su sesión independiente en `hackaflow.simulator.v1`.

## Configuración y herramientas

Los metadatos, idioma, icono y política de indexación están en `frontend/index.html`. Las tareas de instalación, desarrollo, compilación y formato se ejecutan desde el `package.json` raíz. La configuración de Vite pertenece a `frontend/vite.config.ts`; la de TypeScript a `frontend/tsconfig.json`, con una configuración raíz para facilitar su detección por el IDE.

Se retiraron las herramientas de publicación, análisis de rutas, previsualización y plugins de la plataforma de origen. El despliegue está descrito en `vercel.json`; el editor puede usar el servidor de lenguaje TypeScript habitual.

## Plataforma compartida

`backend/migrations` define el backend Supabase: perfiles, equipos, entregas, políticas RLS y funciones de registro, revisión y asignación. `infrastructure/cloud` configura el cliente; `controller/usePlatform` coordina sesión y consultas; `views/pages/PlatformPage` presenta los paneles por rol. La configuración y activación están en `backend/README.md`.

La demo local y la plataforma compartida tienen datos separados. Las contraseñas se gestionan con Supabase Auth. La sesión de la plataforma se persiste en `sessionStorage` con una clave de Auth única por pestaña; cerrar sesión o alcanzar 15 minutos de inactividad afecta solo a esa pestaña. La interfaz avisa un minuto antes del cierre automático. La plataforma necesita conexión; el simulador académico sigue disponible sin modificar equipos.
