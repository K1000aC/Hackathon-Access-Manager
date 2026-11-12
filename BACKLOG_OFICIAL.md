# Backlog oficial de HackaFlow

Backlog de trabajo simulado para organizar la evolución de HackaFlow en GitHub Projects. Las fechas son una planificación retrospectiva de ejemplo: del **5 al 12 de noviembre de 2026**. Los títulos usan el formato Conventional Commits para facilitar su búsqueda; las etiquetas se proponen como etiquetas de GitHub.

> Este documento no crea issues ni milestones en GitHub. Cada bloque puede copiarse como issue y asociarse al milestone y etiquetas indicados.

## Milestone: Sprint 1

- **Periodo simulado:** 5–7 de noviembre de 2026
- **Objetivo:** establecer una base accesible, confiable y verificable para la plataforma compartida.

### Issue 1 — `feat(auth): aislar la sesión por pestaña`

- **Fecha simulada:** 5 de noviembre de 2026
- **Descripción:** Como usuario que prueba distintos roles, quiero que cada pestaña mantenga su propia sesión para poder iniciar sesión como estudiante, asesor u organizador en paralelo sin que las cuentas se reemplacen entre sí.
- **Criterios de aceptación:**
  - [ ] La sesión se persiste en almacenamiento limitado a la pestaña actual.
  - [ ] La clave de almacenamiento de Auth no se comparte entre pestañas.
  - [ ] Cerrar sesión en una pestaña no cierra la sesión de las demás.
  - [ ] Una prueba E2E demuestra dos usuarios autenticados simultáneamente en pestañas distintas.
- **Etiquetas:** `feature`, `auth`, `frontend`, `security`

### Issue 2 — `feat(auth): cerrar sesión tras inactividad`

- **Fecha simulada:** 5 de noviembre de 2026
- **Descripción:** Como usuario de la plataforma, quiero recibir una advertencia antes de que expire mi sesión por inactividad para evitar dejar una cuenta sensible abierta en un dispositivo compartido.
- **Criterios de aceptación:**
  - [ ] La advertencia aparece después de 14 minutos sin actividad.
  - [ ] La sesión se cierra al completar 15 minutos de inactividad.
  - [ ] La actividad o la acción «Seguir conectado» reinicia el contador.
  - [ ] El cierre automático afecta solo a la pestaña actual y comunica el motivo.
- **Etiquetas:** `feature`, `auth`, `frontend`, `security`

### Issue 3 — `test(auth): cubrir recuperación y errores de inicio de sesión`

- **Fecha simulada:** 6 de noviembre de 2026
- **Descripción:** Como persona usuaria, quiero recibir mensajes claros y pruebas del flujo de acceso y recuperación para saber cómo resolver errores sin exponer información de la cuenta.
- **Criterios de aceptación:**
  - [ ] Se prueban inicio de sesión correcto, credenciales incorrectas y sesión expirada.
  - [ ] Se valida el flujo de recuperación y establecimiento de contraseña.
  - [ ] Los mensajes no revelan si un correo está registrado.
  - [ ] Las pruebas se ejecutan sin credenciales reales ni secretos en el repositorio.
- **Etiquetas:** `testing`, `auth`, `frontend`, `security`

### Issue 4 — `feat(ui): mejorar navegación accesible con teclado`

- **Fecha simulada:** 6 de noviembre de 2026
- **Descripción:** Como usuario que navega con teclado o tecnología asistiva, quiero recorrer paneles, pestañas y diálogos de forma predecible para completar tareas sin depender del mouse.
- **Criterios de aceptación:**
  - [ ] Pestañas y navegación principal tienen nombres accesibles y estados seleccionados.
  - [ ] El foco se mueve de forma visible y lógica al abrir y cerrar navegación móvil.
  - [ ] Los diálogos anuncian su título, propósito y acciones a lectores de pantalla.
  - [ ] No se introduce una regresión en las pruebas E2E existentes.
- **Etiquetas:** `accessibility`, `frontend`, `quality`

### Issue 5 — `fix(ui): reforzar estados de carga y error`

- **Fecha simulada:** 7 de noviembre de 2026
- **Descripción:** Como usuario, quiero distinguir carga, ausencia de datos y errores de conexión para entender el estado real de mis entregas y no confundir un fallo con una operación exitosa.
- **Criterios de aceptación:**
  - [ ] Consultas y operaciones muestran estados de carga mientras están pendientes.
  - [ ] Los errores de lectura y escritura se anuncian mediante regiones accesibles.
  - [ ] Los errores no se presentan como confirmaciones exitosas.
  - [ ] Se puede reintentar una consulta fallida desde la interfaz.
- **Etiquetas:** `bug`, `frontend`, `quality`

### Issue 6 — `test(platform): ampliar cobertura de permisos RLS`

- **Fecha simulada:** 7 de noviembre de 2026
- **Descripción:** Como responsable de la plataforma, quiero verificar los permisos directamente en PostgreSQL para evitar que un usuario acceda o modifique datos de equipos ajenos saltándose la interfaz.
- **Criterios de aceptación:**
  - [ ] Se prueban las políticas para estudiante, asesor asignado, asesor no asignado y organizador.
  - [ ] Se prueban lecturas y escrituras directas no autorizadas.
  - [ ] Las decisiones críticas se validan en funciones SQL y políticas RLS.
  - [ ] Las pruebas usan PostgreSQL local y datos ficticios.
- **Etiquetas:** `testing`, `backend`, `security`

### Issue 7 — `docs(platform): documentar puesta en marcha por entorno`

- **Fecha simulada:** 7 de noviembre de 2026
- **Descripción:** Como persona que mantiene el proyecto, quiero instrucciones reproducibles para configurar Supabase y Vercel sin compartir secretos ni ejecutar migraciones fuera de orden.
- **Criterios de aceptación:**
  - [ ] Se documentan variables requeridas y sus nombres, sin incluir valores secretos.
  - [ ] Se explica el orden de migraciones y cómo comprobar su aplicación.
  - [ ] Se documentan URL de redirección y configuración de Auth.
  - [ ] Se incluyen pasos de verificación para Preview y Production.
- **Etiquetas:** `documentation`, `platform`, `deployment`

### Issue 8 — `feat(ui): respetar preferencia de movimiento reducido`

- **Fecha simulada:** 7 de noviembre de 2026
- **Descripción:** Como usuario sensible al movimiento, quiero que la interfaz reduzca animaciones cuando mi sistema así lo indique para poder navegar con comodidad.
- **Criterios de aceptación:**
  - [ ] Las animaciones decorativas respetan `prefers-reduced-motion`.
  - [ ] Las transiciones funcionales no ocultan información ni bloquean acciones.
  - [ ] Se valida el comportamiento en las pantallas de inicio, panel y navegación móvil.
- **Etiquetas:** `accessibility`, `frontend`, `quality`

## Milestone: Sprint 2

- **Periodo simulado:** 8–10 de noviembre de 2026
- **Objetivo:** completar los flujos colaborativos de equipos, gestión externa, entregas y revisión.

### Issue 9 — `feat(teams): permitir solicitudes de integrantes`

- **Fecha simulada:** 8 de noviembre de 2026
- **Descripción:** Como líder de equipo, quiero solicitar altas o bajas de integrantes para mantener la composición del equipo bajo revisión del asesor asignado.
- **Criterios de aceptación:**
  - [ ] El líder puede solicitar agregar o retirar a un estudiante con motivo.
  - [ ] El asesor asignado puede aprobar o rechazar y registrar observaciones.
  - [ ] El líder no puede retirarse a sí mismo y se respetan los cupos.
  - [ ] Una solicitud pendiente no reserva un integrante en más de un equipo.
- **Etiquetas:** `feature`, `teams`, `backend`, `frontend`

### Issue 10 — `feat(teams): mostrar roster y estado de solicitudes`

- **Fecha simulada:** 8 de noviembre de 2026
- **Descripción:** Como integrante, quiero consultar el equipo, su líder, asesor y solicitudes de cambios para entender quién participa y qué decisiones siguen pendientes.
- **Criterios de aceptación:**
  - [ ] El roster muestra integrantes y líder con información comprensible.
  - [ ] Los estados pendiente, aprobado y rechazado se distinguen visualmente.
  - [ ] Solo usuarios con acceso al equipo pueden consultar su roster.
  - [ ] La información se actualiza al recargar o volver a la pestaña.
- **Etiquetas:** `feature`, `teams`, `frontend`, `privacy`

### Issue 11 — `feat(management): compartir tablero público y repositorio`

- **Fecha simulada:** 8 de noviembre de 2026
- **Descripción:** Como líder de equipo, quiero publicar el enlace al tablero de gestión, el repositorio y un resumen del progreso para que el asesor pueda revisar el trabajo del equipo.
- **Criterios de aceptación:**
  - [ ] Se guardan enlaces HTTPS del tablero y del repositorio y un resumen del proyecto.
  - [ ] El formulario valida campos requeridos y límites de longitud.
  - [ ] El equipo ve el resumen y puede abrir ambos enlaces en una pestaña nueva.
  - [ ] El cambio de cualquiera de esos datos invalida la revisión previa.
- **Etiquetas:** `feature`, `management`, `frontend`, `backend`

### Issue 12 — `feat(management): validar visibilidad pública con asesor`

- **Fecha simulada:** 9 de noviembre de 2026
- **Descripción:** Como asesor asignado, quiero confirmar que el tablero y el repositorio abren sin iniciar sesión para registrar una revisión explícita de los recursos compartidos.
- **Criterios de aceptación:**
  - [ ] Solo el asesor asignado puede aprobar o pedir cambios en esos enlaces.
  - [ ] Para aprobar, debe confirmar que ambos recursos son accesibles sin sesión.
  - [ ] La solicitud de cambios requiere observaciones.
  - [ ] La interfaz distingue revisión pendiente, validada y con cambios solicitados.
- **Etiquetas:** `feature`, `management`, `backend`, `security`

### Issue 13 — `feat(deliveries): crear tareas y entregas de equipo`

- **Fecha simulada:** 9 de noviembre de 2026
- **Descripción:** Como líder, quiero crear tareas independientes de las etapas del AFD para organizar trabajo adicional sin alterar el progreso formal del acceso.
- **Criterios de aceptación:**
  - [ ] El líder puede guardar una tarea como borrador o enviarla a revisión.
  - [ ] La tarea incluye título, descripción, enlace y archivo opcional.
  - [ ] Crear o aprobar una tarea no cambia la cadena R → M → P.
  - [ ] El asesor asignado y organización pueden revisar según sus permisos.
- **Etiquetas:** `feature`, `deliveries`, `frontend`, `backend`

### Issue 14 — `feat(deliveries): adjuntar documentos de entrega`

- **Fecha simulada:** 9 de noviembre de 2026
- **Descripción:** Como estudiante, quiero adjuntar PDF, DOCX o PPTX a una entrega para compartir evidencias directamente desde el panel.
- **Criterios de aceptación:**
  - [ ] Se aceptan PDF, DOCX y PPTX con límite de 10 MB por archivo.
  - [ ] Se validan tipo y tamaño antes de subir y se muestra un error claro si no cumplen.
  - [ ] Los archivos permanecen privados y solo los usuarios autorizados pueden descargarlos.
  - [ ] No se puede borrar un archivo mientras esté vinculado a una entrega.
- **Etiquetas:** `feature`, `deliveries`, `storage`, `security`

### Issue 15 — `feat(review): calificar propuesta final antes de certificar`

- **Fecha simulada:** 10 de noviembre de 2026
- **Descripción:** Como asesor asignado, quiero aprobar la propuesta final junto con una calificación de 0 a 100 para que la certificación represente una entrega realmente revisada.
- **Criterios de aceptación:**
  - [ ] La aprobación final exige calificación dentro del rango de 0 a 100.
  - [ ] Solo el asesor asignado puede aprobar y calificar la propuesta final.
  - [ ] La aprobación, calificación, revisor y fecha se guardan de forma transaccional.
  - [ ] No se emite certificado si falta aprobación o calificación.
- **Etiquetas:** `feature`, `review`, `backend`, `security`

### Issue 16 — `feat(certificates): emitir certificado de finalización`

- **Fecha simulada:** 10 de noviembre de 2026
- **Descripción:** Como equipo, quiero consultar un certificado de finalización solo después de completar y aprobar la propuesta final con calificación del asesor.
- **Criterios de aceptación:**
  - [ ] El certificado se muestra únicamente para equipos con flujo RMP y calificación registrada.
  - [ ] Incluye nombre del equipo, nota, fecha de revisión y folio.
  - [ ] El usuario puede imprimir o guardar el certificado como PDF.
  - [ ] Una tarea auxiliar o una aprobación sin nota no genera certificado.
- **Etiquetas:** `feature`, `certificates`, `frontend`, `quality`

### Issue 17 — `test(deliveries): probar revisión, archivos y permisos`

- **Fecha simulada:** 10 de noviembre de 2026
- **Descripción:** Como equipo de desarrollo, quiero cubrir los nuevos flujos de gestión, archivos y calificación con pruebas automatizadas para reducir regresiones entre UI y base de datos.
- **Criterios de aceptación:**
  - [ ] Pruebas SQL verifican roles, RLS y funciones de gestión y revisión.
  - [ ] Pruebas E2E cubren tareas con adjunto, enlaces públicos y certificado condicionado.
  - [ ] Se prueban casos inválidos de tamaño, tipo y nota fuera de rango.
  - [ ] Las pruebas no modifican datos reales del evento.
- **Etiquetas:** `testing`, `deliveries`, `management`, `quality`

## Milestone: Sprint 3

- **Periodo simulado:** 11–12 de noviembre de 2026
- **Objetivo:** mejorar operación, observabilidad, publicación y calidad final de la plataforma.

### Issue 18 — `feat(platform): actualizar vistas compartidas en tiempo real`

- **Fecha simulada:** 11 de noviembre de 2026
- **Descripción:** Como asesor u organizador, quiero recibir cambios recientes de entregas y equipos sin esperar el siguiente sondeo para coordinar revisiones en vivo.
- **Criterios de aceptación:**
  - [ ] Se evalúa y documenta una estrategia Supabase Realtime para tablas autorizadas.
  - [ ] El canal respeta las políticas RLS existentes.
  - [ ] Se limpia la suscripción al cambiar de pantalla o cerrar sesión.
  - [ ] Existe recuperación mediante recarga cuando Realtime no está disponible.
- **Etiquetas:** `feature`, `realtime`, `backend`, `frontend`

### Issue 19 — `feat(notifications): avisar entregas pendientes de revisión`

- **Fecha simulada:** 11 de noviembre de 2026
- **Descripción:** Como asesor asignado, quiero identificar rápidamente cuando hay una entrega nueva para priorizar revisiones sin buscar manualmente entre todos los equipos.
- **Criterios de aceptación:**
  - [ ] El panel muestra cantidad y equipo de entregas pendientes.
  - [ ] La notificación se limita a equipos visibles para el asesor.
  - [ ] Al abrir una entrega, se presenta su etapa, fecha y archivos disponibles.
  - [ ] No se envían correos ni notificaciones externas sin configuración y consentimiento documentados.
- **Etiquetas:** `feature`, `notifications`, `frontend`, `privacy`

### Issue 20 — `feat(audit): registrar cambios de roles y revisiones`

- **Fecha simulada:** 11 de noviembre de 2026
- **Descripción:** Como organizador, quiero consultar quién cambió roles, asignaciones y decisiones de revisión para mantener trazabilidad de las acciones relevantes.
- **Criterios de aceptación:**
  - [ ] Se registra actor, acción, objetivo y fecha en operaciones privilegiadas.
  - [ ] Los registros de auditoría no pueden alterarse mediante la API de usuario.
  - [ ] Solo organización autorizada consulta el historial global.
  - [ ] No se guardan contraseñas, tokens ni contenido sensible innecesario.
- **Etiquetas:** `feature`, `audit`, `backend`, `security`

### Issue 21 — `feat(ops): añadir diagnóstico de conexión Supabase`

- **Fecha simulada:** 11 de noviembre de 2026
- **Descripción:** Como responsable de soporte, quiero identificar si el frontend está sin configuración, sin conexión o con un error de permisos para orientar la resolución sin exponer credenciales.
- **Criterios de aceptación:**
  - [ ] La UI distingue configuración incompleta, fallo de red y fallo de autorización.
  - [ ] Se ofrece reintento para operaciones recuperables.
  - [ ] Los mensajes de diagnóstico nunca imprimen claves ni tokens.
  - [ ] La plataforma conserva disponible el simulador cuando Supabase no está configurado.
- **Etiquetas:** `feature`, `operations`, `frontend`, `security`

### Issue 22 — `test(e2e): validar recorridos por rol en navegadores`

- **Fecha simulada:** 12 de noviembre de 2026
- **Descripción:** Como responsable de calidad, quiero comprobar los flujos principales por rol en navegadores compatibles antes de cada publicación.
- **Criterios de aceptación:**
  - [ ] Se cubren estudiante, asesor asignado y organizador con datos simulados.
  - [ ] Se validan inicio y cierre de sesión, registro, revisión y certificado.
  - [ ] Se ejecuta al menos Chromium en integración continua y se documentan los demás navegadores probados.
  - [ ] Los fallos adjuntan evidencia útil sin datos personales reales.
- **Etiquetas:** `testing`, `e2e`, `quality`, `ci`

### Issue 23 — `ci(deploy): verificar compilación antes de publicar`

- **Fecha simulada:** 12 de noviembre de 2026
- **Descripción:** Como responsable del repositorio, quiero bloquear publicaciones que no pasen pruebas, tipos y compilación para evitar desplegar cambios incompletos.
- **Criterios de aceptación:**
  - [ ] El pipeline ejecuta `npm test`, `npm run typecheck` y `npm run build`.
  - [ ] Las pruebas E2E definidas para CI reportan errores y evidencias.
  - [ ] La publicación de producción espera la validación del pipeline.
  - [ ] Variables sensibles se configuran en el proveedor de despliegue, no en el workflow.
- **Etiquetas:** `ci`, `deployment`, `testing`, `operations`

### Issue 24 — `docs(release): documentar checklist de publicación`

- **Fecha simulada:** 12 de noviembre de 2026
- **Descripción:** Como persona encargada de liberar una versión, quiero una lista de verificación para Supabase y Vercel que reduzca errores al publicar cambios de esquema o frontend.
- **Criterios de aceptación:**
  - [ ] El checklist confirma rama de producción, build command y directorio de salida.
  - [ ] Incluye verificación de versión de Node compatible con el proyecto.
  - [ ] Indica cómo revisar Preview, Production y logs sin confundir advertencias con errores.
  - [ ] Incluye verificación posterior de autenticación, permisos y migraciones.
- **Etiquetas:** `documentation`, `deployment`, `operations`

### Issue 25 — `feat(pwa): preparar instalación web opcional`

- **Fecha simulada:** 12 de noviembre de 2026
- **Descripción:** Como participante, quiero poder instalar HackaFlow como acceso web opcional en mi dispositivo sin cambiar el comportamiento de la plataforma compartida ni prometer trabajo offline.
- **Criterios de aceptación:**
  - [ ] Se evalúa el manifiesto y los requisitos de instalación en navegadores compatibles.
  - [ ] El acceso instalado abre la aplicación mediante HTTPS.
  - [ ] Se informa que las operaciones compartidas requieren conexión.
  - [ ] No se almacenan entregas ni credenciales en caché offline.
- **Etiquetas:** `feature`, `pwa`, `frontend`, `security`
