# Arquitectura

El frontend mantiene MVC dentro de una separación por responsabilidades:

1. La vista presenta datos y emite acciones.
2. Los controladores coordinan la simulación y el repositorio de equipos.
3. El modelo define el AFD, sus transiciones y los tipos de equipo.
4. La infraestructura implementa la persistencia del navegador y las notificaciones de cambio.

`app/App.tsx` compone las pantallas y conserva el equipo seleccionado. El modelo del AFD no depende del navegador. El repositorio conserva la clave `hackaflow.accepted.v1` para mantener los datos de la demostración.

## Configuración y herramientas

Los metadatos, idioma, icono y política de indexación están en `frontend/index.html`. Las tareas de instalación, desarrollo, compilación y formato se ejecutan desde el `package.json` raíz. La configuración de Vite pertenece a `frontend/vite.config.ts`; la de TypeScript a `frontend/tsconfig.json`, con una configuración raíz para facilitar su detección por el IDE.

Se retiraron las herramientas de publicación, análisis de rutas, previsualización y plugins de la plataforma de origen. El despliegue está descrito en `vercel.json`; el editor puede usar el servidor de lenguaje TypeScript habitual.

## Backend futuro

`backend` delimita el lugar de la futura API, no un servicio activo. La separación actual no introduce llamadas de red ni cambia el alcance local de los datos. Cuando exista una API, sus rutas y comandos de despliegue deberán añadirse explícitamente.
