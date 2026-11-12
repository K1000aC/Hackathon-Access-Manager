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
- `backend`: estructura reservada para una futura API; consulta su README.
- `docs`: arquitectura y decisiones del proyecto.

## Demostración

Acreditación → registrar equipo → Modelo AFD → ejecutar `RMP` → guardar equipo aceptado → Equipos aceptados. El almacenamiento usa `localStorage`, persiste al recargar y se sincroniza entre pestañas del mismo origen. No hay base de datos remota ni sincronización entre dispositivos. Los registros existentes se conservan si el sitio mantiene el mismo origen.

## Despliegue

Importa el repositorio en Vercel con la raíz del repositorio como Root Directory. `vercel.json` configura la compilación, `frontend/dist` y el fallback de navegación de la SPA. El frontend funciona en el dominio asignado sin direcciones de servidor locales en el código.
