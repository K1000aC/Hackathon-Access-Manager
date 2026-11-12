# Guía de exposición: Modelo AFD de HackaFlow

Guion y referencia para explicar el Autómata Finito Determinista (AFD) de HackaFlow, demostrarlo en pantalla y presentar cómo se relaciona con el flujo de la plataforma.

## 1. Objetivo de la exposición

Al terminar la presentación, el público debería entender:

1. Qué proceso representa el autómata.
2. Qué significan sus símbolos y estados.
3. Cómo se calcula una transición.
4. Por qué la cadena `RMP` se acepta y otras secuencias se rechazan.
5. Cómo leer la visualización y usar la consola de pruebas.
6. Qué representa `qerr` y por qué es un estado sumidero.
7. Qué diferencia hay entre la simulación académica y las operaciones reales de HackaFlow.

## 2. Idea general

El AFD representa el orden de tres etapas del flujo de acceso de un equipo:

- **R — Registro:** el equipo fue registrado.
- **M — Mentoría:** la etapa de mentoría fue aprobada.
- **P — Prototipo:** la etapa del prototipo fue aprobada.

El único recorrido completo aceptado es:

```text
R → M → P
```

Por lo tanto, el lenguaje reconocido por el modelo es:

```text
L(M) = {RMP}
```

La secuencia debe contener los tres símbolos, en ese orden y sin símbolos adicionales. El AFD no acepta un prefijo incompleto como `R` o `RM`, ni una secuencia desordenada como `RP`.

## 3. Definición formal

Un AFD se suele definir como la quíntupla:

```text
M = (Q, Σ, δ, q₀, F)
```

En HackaFlow:

- **Q — Conjunto de estados:** `{q0, q1, q2, q3, qerr}`.
- **Σ — Alfabeto:** `{R, M, P}`.
- **δ — Función de transición:** indica el siguiente estado para el estado actual y el símbolo leído.
- **q₀ — Estado inicial:** `q0`.
- **F — Estados de aceptación:** `{q3}`.

Se llama determinista porque, para cada par formado por un estado y un símbolo del alfabeto, existe exactamente un siguiente estado. También es un AFD completo sobre `Σ`: la tabla define una transición para cada símbolo desde cada estado.

La entrada es una **cadena** de símbolos. El autómata la acepta únicamente después de leerla completa y terminar en un estado de aceptación. Llegar a `q3` antes de terminar no basta: cualquier símbolo adicional mueve el recorrido a `qerr`.

### Significado de los estados

| Estado | Interpretación | ¿Acepta? |
|---|---|---:|
| `q0` | Inicio; espera el registro (`R`). | No |
| `q1` | Registro completado; espera mentoría (`M`). | No |
| `q2` | Mentoría completada; espera prototipo (`P`). | No |
| `q3` | Las tres etapas están completas en el orden esperado. | Sí |
| `qerr` | Se encontró una etapa fuera de orden o un símbolo no permitido. | No |

`q3` es el único estado de aceptación. Los demás representan una entrada incompleta o inválida.

## 4. Alfabeto y función de transición

La función `δ(estado, símbolo)` devuelve el estado al que se mueve el autómata.

| Estado actual | Lee `R` | Lee `M` | Lee `P` |
|---|---|---|---|
| `q0` | `q1` | `qerr` | `qerr` |
| `q1` | `qerr` | `q2` | `qerr` |
| `q2` | `qerr` | `qerr` | `q3` |
| `q3` | `qerr` | `qerr` | `qerr` |
| `qerr` | `qerr` | `qerr` | `qerr` |

Las tres transiciones que forman el camino válido son:

```text
δ(q0, R) = q1
δ(q1, M) = q2
δ(q2, P) = q3
```

Todas las demás combinaciones de la tabla conducen a `qerr`. En el simulador, si se escribe un carácter fuera del alfabeto —por ejemplo, `X`—, también se interpreta como rechazo y se envía a `qerr`.

### ¿Por qué hay transiciones que rechazan?

El autómata debe definir qué sucede ante una entrada inesperada. Por ejemplo:

- Leer `M` antes de `R` no corresponde al flujo.
- Leer `P` antes de terminar la mentoría no corresponde al flujo.
- Repetir una etapa rompe el orden requerido.
- Agregar una etapa después de completar `RMP` hace que la cadena ya no sea exactamente `RMP`.

En vez de dejar el recorrido indefinido, todas esas situaciones se representan con `qerr`.

## 5. Qué significa `qerr`

`qerr` es el **estado sumidero de rechazo**:

1. El autómata entra en `qerr` cuando encuentra una transición incorrecta o un símbolo fuera del alfabeto.
2. Una vez allí, permanece en `qerr` aunque lea más símbolos.
3. Como `qerr` no pertenece a `F`, la cadena se rechaza.

Formalmente, para cada símbolo `a` del alfabeto:

```text
δ(qerr, a) = qerr
```

Por ejemplo, `RXM` se procesa así:

```text
q0 --R--> q1 --X--> qerr --M--> qerr
```

El simulador consume el resto de la cadena para mostrar el recorrido completo, pero el rechazo ya es inevitable desde que se llegó a `qerr`.

## 6. Recorridos de ejemplo

### Aceptación: `RMP`

| Paso | Símbolo leído | Transición | Interpretación |
|---:|:---:|---|---|
| Inicio | — | — | El autómata está en `q0`. |
| 1 | `R` | `q0 → q1` | Se registró el equipo. |
| 2 | `M` | `q1 → q2` | Se aprobó la mentoría. |
| 3 | `P` | `q2 → q3` | Se aprobó el prototipo. |
| Fin | — | — | La entrada terminó en `q3`; se acepta. |

### Progreso incompleto: `R`

```text
q0 --R--> q1
```

El registro está completo, pero la cadena terminó en `q1`, que no es un estado de aceptación. Por eso se informa como progreso, no como aceptación.

### Progreso incompleto: `RM`

```text
q0 --R--> q1 --M--> q2
```

El registro y la mentoría están completos, pero todavía falta `P`. La cadena termina en `q2` y se rechaza como cadena completa.

### Rechazo por orden: `RP`

```text
q0 --R--> q1 --P--> qerr
```

Después del registro se esperaba `M`, no `P`. El autómata rechaza la secuencia.

### Rechazo por símbolo extra: `RMPM`

```text
q0 --R--> q1 --M--> q2 --P--> q3 --M--> qerr
```

Aunque el prefijo `RMP` completa el flujo, la cadena tiene un símbolo adicional. La entrada completa termina en `qerr`, así que se rechaza.

### Rechazo por símbolo desconocido: `RXM`

```text
q0 --R--> q1 --X--> qerr --M--> qerr
```

`X` no pertenece a `{R, M, P}`. El simulador lo maneja como una transición de rechazo.

### Cadena vacía

La cadena vacía `ε` no contiene ninguna etapa. El autómata permanece en `q0`, que no es de aceptación; por eso `ε` no se acepta.

## 7. Cómo leer la demostración visual

En la sección **Modelo AFD** de HackaFlow, el diagrama aparece antes de la consola:

- La flecha **START** indica el comienzo en `q0`.
- Los círculos representan estados.
- Las flechas dirigidas representan transiciones.
- Las etiquetas `R`, `M` y `P` indican qué símbolo activa cada transición.
- El camino principal `q0 → q1 → q2 → q3` muestra el orden válido.
- Las rutas hacia `qerr` representan entradas incorrectas.
- El bucle sobre `qerr` muestra visualmente que, una vez rechazado, el recorrido permanece en ese estado.
- El doble círculo de `q3` indica que es el estado de aceptación.
- Al avanzar la simulación, el estado actual y las transiciones completadas se resaltan en el diagrama.
- El panel de resultado indica el estado actual o el resultado final.

El diagrama es una representación del mismo modelo que usa la tabla formal: no son dos reglas distintas.

## 8. Guion de exposición oral

El texto siguiente se puede leer tal cual o adaptar al tiempo disponible.

### Apertura

> Hola. Vamos a presentar el modelo de acceso de HackaFlow mediante un Autómata Finito Determinista. El objetivo del modelo es representar, de manera visual y verificable, el orden que debe seguir un equipo para completar su flujo: primero registro, después mentoría y finalmente prototipo.

### Conexión con el problema

> En un flujo de acceso no basta con saber que ocurrió una actividad; también importa el orden. Un equipo no debería completar la etapa de prototipo antes del registro o de la mentoría. El autómata nos permite formalizar esas reglas y mostrar qué pasa con cada evento.

### Presentación formal

> Nuestro autómata se define como la quíntupla M igual a Q, sigma, delta, q cero y F. Q contiene los estados q0, q1, q2, q3 y qerr. El alfabeto sigma contiene R, M y P. El estado inicial es q0 y el único estado de aceptación es q3. Por eso, el lenguaje reconocido es exactamente el conjunto que contiene la cadena RMP.

### Explicación del alfabeto

> La R representa el registro del equipo. La M representa la aprobación de la mentoría. La P representa la aprobación del prototipo. Cada letra representa una etapa ya registrada en el flujo, no una palabra que el usuario tenga que escribir en la plataforma.

### Explicación de los estados y transiciones

> Empezamos en q0, donde esperamos R. Si leemos R, avanzamos a q1. En q1 esperamos M; al leerla pasamos a q2. En q2 esperamos P y, cuando se lee, llegamos a q3. q3 es el estado final de aceptación. Si en cualquiera de esos puntos aparece una etapa distinta de la esperada, el autómata pasa a qerr.

> Cada combinación de estado y símbolo tiene una única respuesta. Esa propiedad es la que hace determinista al autómata. Además, la tabla muestra las transiciones para los tres símbolos desde todos los estados, así que está completa sobre el alfabeto definido.

### Demostración de aceptación

> Ahora probemos la cadena RMP. Al leer R vamos de q0 a q1; al leer M vamos de q1 a q2; y al leer P vamos de q2 a q3. Como ya no quedan símbolos y q3 es de aceptación, el resultado es cadena aceptada. En pantalla podemos ver cómo se resalta el estado actual y cómo queda marcado el camino que ya recorrimos.

### Demostración de progreso incompleto

> Si probamos solo R, terminamos en q1. Si probamos RM, terminamos en q2. Son recorridos válidos hasta ese momento, pero no son cadenas aceptadas porque todavía falta completar la secuencia. Esto diferencia el progreso parcial de la aceptación final del AFD.

### Demostración de rechazo

> Probemos RP. Después de R estamos en q1, donde se esperaba M. Como llega P, pasamos a qerr y la entrada se rechaza. Si probamos RMPM, llegamos primero a q3, pero el símbolo M adicional nos lleva a qerr. El lenguaje exige exactamente RMP; no basta con que RMP aparezca como prefijo.

### Significado de `qerr`

> qerr significa estado de error o rechazo. Se llama sumidero porque cualquier símbolo posterior mantiene al autómata en qerr. No existe una ruta de regreso al camino válido. Esto permite que todas las entradas tengan una respuesta definida y que cualquier error sea visible.

### Uso de la aplicación

> En la pantalla del Modelo AFD, primero vemos el diagrama. Debajo aparece el progreso de los equipos que son visibles para la cuenta. Podemos seleccionar uno para inspeccionar su cadena, o usar la consola educativa para probar una cadena manualmente. El selector incluye casos de aceptación, progreso parcial, orden incorrecto, símbolo extra y símbolo desconocido.

> Con “Paso” avanzamos un símbolo a la vez. Con “Ejecutar cadena” observamos el procesamiento automático. “Reiniciar” vuelve el cursor al inicio de la misma cadena para repetir la demostración. La barra y el contador muestran cuántos símbolos se han procesado, y el panel de resultado informa el estado o la decisión.

### Datos de equipos y alcance

> La aplicación puede mostrar equipos locales de demostración y equipos compartidos que la cuenta tenga permiso para consultar. El progreso compartido se actualiza al solicitarlo, al volver a la pestaña y periódicamente. Si no hay sesión o no hay equipos visibles, todavía se pueden probar los casos educativos.

> Es importante distinguir la simulación de la operación real: probar una cadena en la consola no cambia equipos, aprobaciones ni certificados. En el flujo real, las etapas avanzan mediante las operaciones correspondientes y sus revisiones. Además, que el AFD termine en q3 representa que el flujo RMP está completo; por sí solo no reemplaza los requisitos del certificado, como la entrega final revisada y la calificación registrada por el asesor.

### Cierre

> En conclusión, el AFD traduce una regla de negocio a estados y transiciones precisos. La secuencia RMP se acepta porque respeta el orden; una secuencia incompleta, desordenada o con símbolos adicionales se rechaza. La tabla permite comprobar cada transición y el diagrama hace visible el recorrido paso a paso. Así, HackaFlow combina una definición formal de Teoría de la Computación con una demostración interactiva del flujo de acceso.

## 9. Guion de demostración en vivo

Antes de exponer, abre HackaFlow y selecciona **Modelo AFD** en la navegación.

1. **Orientar al público.** Señala que el diagrama está arriba, la lista de progreso debajo y la consola de pruebas más abajo.
2. **Explicar el modelo.** Muestra la tarjeta formal: `M = (Q, Σ, δ, q₀, F)`, el alfabeto y la tabla de transición.
3. **Probar aceptación.** En “Casos de prueba”, selecciona **Aceptación · Flujo completo RMP**. Pulsa **Reiniciar simulación** y luego **Paso** tres veces. Explica cada transición hasta `q3`.
4. **Probar progreso parcial.** Selecciona `RM` y avanza dos pasos. Destaca que termina en `q2`: no es una cadena aceptada porque falta `P`.
5. **Probar un orden incorrecto.** Selecciona `RP`, reinicia y ejecuta la cadena. Señala la transición hacia `qerr`.
6. **Probar el estado sumidero.** Selecciona `RXM` o `RMPM`. Muestra que, una vez que el recorrido llega a `qerr`, no vuelve a `q1`, `q2` ni `q3`.
7. **Conectar con equipos.** Si hay equipos visibles, selecciona **Ver progreso** o usa el selector de equipo. Explica si la tarjeta indica una fuente local de demostración o un equipo compartido.
8. **Aclarar el alcance.** Cierra recordando que la consola es educativa y no modifica los registros reales; la aceptación RMP tampoco sustituye los requisitos de revisión y calificación del certificado.

### Preparación y contingencias

- Si la lista de equipos está vacía, usa los casos de prueba: la exposición no depende de tener registros reales.
- Si quieres mostrar datos compartidos, inicia sesión con una cuenta autorizada antes de la presentación y verifica que tenga equipos visibles.
- El botón **Actualizar progreso** solicita una actualización inmediata. En condiciones normales, los datos compartidos también se consultan periódicamente cada 15 segundos y al volver a la pestaña.
- No presentes datos personales de equipos o estudiantes sin autorización; usa casos de prueba o datos de demostración cuando sea posible.
- Puedes escribir las cadenas manualmente. El simulador normaliza las letras a mayúsculas y quita espacios; usa `X` en `RXM` para mostrar el caso fuera del alfabeto.
- La consola conserva localmente las últimas pruebas de ese navegador. Esa memoria es independiente de las aprobaciones y datos compartidos de la plataforma.

## 10. Prompt para generar un video explicativo con IA

Puedes copiar el siguiente prompt en una herramienta de generación de video. Si la herramienta permite adjuntar imágenes, añade capturas reales de la plataforma y pide que las use como referencia visual.

```text
Genera un video tutorial y explicativo en español latinoamericano, de 2 a 3 minutos, para presentar HackaFlow y su sección “Modelo AFD”. El público son estudiantes y docentes de Teoría de la Computación. Usa un tono claro, didáctico y profesional, con narración pausada, subtítulos en español y rótulos legibles. Formato 16:9, resolución 1080p.

IMPORTANTE: si se proporcionan capturas de HackaFlow, respeta fielmente su contenido y distribución. No inventes botones, pantallas, nombres de equipos, cifras, resultados ni funciones. No muestres credenciales ni datos personales. Si no hay capturas, representa un diagrama esquemático genérico y rotúlalo claramente como ilustración; no lo hagas pasar por una captura real de la aplicación.

Estructura sugerida:

1. Apertura (0:00–0:15): mostrar HackaFlow y el título “Modelo AFD: recorrido de acceso”. Explicar que se modelan las etapas Registro, Mentoría y Prototipo.
2. Definición formal (0:15–0:45): presentar “M = (Q, Σ, δ, q₀, F)”. Mostrar Q = {q0, q1, q2, q3, qerr}, Σ = {R, M, P}, estado inicial q0 y conjunto de aceptación F = {q3}. Aclarar que el lenguaje aceptado es exactamente {RMP}.
3. Recorrido aceptado (0:45–1:15): animar q0 --R--> q1 --M--> q2 --P--> q3. Rotular R = Registro, M = Mentoría y P = Prototipo. Indicar que q3 es el único estado de aceptación y que la cadena se acepta solo si termina allí después de leer todos sus símbolos.
4. Rechazo y qerr (1:15–1:45): mostrar RP, que llega a qerr porque P aparece antes de M. Después mostrar RMPM, que llega a q3 pero el símbolo extra M la manda a qerr. Explicar que qerr es un estado sumidero: cualquier símbolo posterior mantiene el recorrido en qerr. Mencionar que un símbolo fuera de {R, M, P}, como X, también es rechazado.
5. Uso de la interfaz (1:45–2:25): con capturas reales, mostrar la sección “Modelo AFD”, el diagrama en la parte superior, el progreso de equipos, la definición formal, la consola, el selector de casos de prueba, los botones “Ejecutar cadena”, “Paso” y “Reiniciar simulación”, la barra de progreso y el resultado. Explicar que “Paso” avanza símbolo por símbolo y “Ejecutar cadena” procesa la secuencia automáticamente. Mostrar RMP aceptada y RP rechazada.
6. Alcance y cierre (2:25–2:50): explicar con claridad que las pruebas educativas de la consola no modifican equipos ni certificaciones. La cadena RMP completa representa el flujo del AFD, pero la emisión de un certificado también requiere las condiciones de entrega final, revisión y calificación del asesor. Cerrar con: “El AFD hace explícito el orden, muestra cada transición y permite distinguir progreso, aceptación y rechazo”.

Guía visual:
- Mantén visibles y correctamente escritos q0, q1, q2, q3 y qerr.
- Usa flechas dirigidas y etiquetas de símbolos sobre cada transición.
- Diferencia visualmente el camino válido de las rutas que llevan a qerr, con contraste y una leyenda.
- Representa q3 como estado de aceptación con doble círculo y qerr con un bucle de retorno.
- Incluye la tabla completa de transiciones de forma breve o como apoyo en pantalla:
  q0: R→q1, M→qerr, P→qerr
  q1: R→qerr, M→q2, P→qerr
  q2: R→qerr, M→qerr, P→q3
  q3: R/M/P→qerr
  qerr: R/M/P→qerr
- No confundas “cadena incompleta” con “cadena aceptada”: R y RM muestran progreso parcial, pero no pertenecen al lenguaje aceptado.
- Pronuncia qerr como “q-error” o “estado de error” y define el término en pantalla.
- Evita música que compita con la narración; usa transiciones suaves y subtítulos sincronizados.

Entrega también una versión de la narración como texto y una lista de escenas con sus tiempos. Revisa ortografía y exactitud matemática antes de finalizar.
```

## 11. Referencia de implementación

El modelo formal está definido en [`frontend/src/model/automaton.ts`](../frontend/src/model/automaton.ts). La tarjeta con la quíntupla y la tabla está en [`frontend/src/views/components/FormalCard.tsx`](../frontend/src/views/components/FormalCard.tsx); el diagrama en [`frontend/src/views/components/AutomatonDiagram.tsx`](../frontend/src/views/components/AutomatonDiagram.tsx); y la pantalla con consola y progreso en [`frontend/src/views/pages/SimulatorPage.tsx`](../frontend/src/views/pages/SimulatorPage.tsx).
