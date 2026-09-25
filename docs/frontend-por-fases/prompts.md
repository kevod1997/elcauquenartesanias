# Prompts para sesiones con agentes

Prompts del [PRD](./PRD.md) en orden de uso, reemplazando `N` por la fase. 6.1 va en una sesión
propia y solo si la definición de la fase deja decisiones abiertas; 6.3 va en la misma sesión que
6.2. Para correr varias fases sin supervisión, ver [6.4](#64-loop-sin-supervisión).

## 6.1 Preparación

```text
Prepará la fase N (docs/frontend-por-fases/fases/fase-N.md), sin implementar código.

1. Leé docs/frontend-por-fases/PRD.md, la definición de N en fases/fase-N.md, sus pendientes
   en docs/frontend-por-fases/fases/README.md y el código pertinente. Enumerá las decisiones
   realmente abiertas y qué dato falta para cerrar cada una. Si no queda ninguna, terminá la
   preparación.
2. Resolvé primero lo comprobable en el repositorio y en el contrato del backend
   (../elcauquen-backend/docs/openapi.json y ../elcauquen-backend/docs/contrato-api-borrador.md).
   Para las preguntas técnicas que aún requieran fuentes externas, usá Context7 o la búsqueda
   web con preguntas concretas, alternativas y versiones; verificá en fuentes primarias lo que
   sustenta cada decisión.
3. Cerrá las decisiones técnicas con esa evidencia. Si una elección cambia una
   regla de producto, el contrato del backend o el alcance de la fase, presentá
   las alternativas y tu recomendación al usuario; esperá su decisión.
4. Invocá /domain-modeling contra ../elcauquen-backend/CONTEXT.md (el front no tiene
   CONTEXT.md propio): usá sus términos y, si una decisión agrega o cambia uno,
   proponé el cambio al usuario como pendiente del backend. Si no hay términos
   nuevos, decilo en el cierre.
5. Invocá /writing-for-agents y escribí en "Definición" de fases/fase-N.md cada
   decisión, su motivo y sus fuentes, numeradas FN-D1, FN-D2… (D1–D5 son las
   globales del PRD). El registro de la implementación va después, en el mismo archivo,
   y remite a esas decisiones sin copiarlas. Ajustá los pendientes de fases/README.md. Cerrá
   cuando cada pendiente de N esté resuelto, reasignado o descartado con motivo.
   Creá un commit local solo con esa documentación.
```

## 6.2 Implementación

```text
Implementá la fase N (docs/frontend-por-fases/fases/fase-N.md) de punta a punta en esta sesión.

1. Arranque: leé docs/frontend-por-fases/fases/README.md, docs/frontend-por-fases/PRD.md,
   fases/fase-N.md y solo las partes del contrato del backend que esa fase usa
   (../elcauquen-backend/docs/openapi.json y la sección pertinente de
   ../elcauquen-backend/docs/contrato-api-borrador.md). Verificá las dependencias de N según
   la tabla del PRD; si alguna está abierta, retomá esa fase como alcance de la sesión.
2. Decisiones: resolvé vos los detalles técnicos compatibles con el PRD y el contrato.
   Consultame solo cuando la única salida cambie una regla de producto, el contrato del
   backend o el alcance de la fase, o cuando dos requisitos sean incompatibles; mientras
   esperás, seguí con lo que no depende de esa respuesta. Las mejoras opcionales van a
   "Mejoras opcionales (sin fase)" de fases/README.md.
3. Implementación: usá los tipos generados; no escribas a mano formas que estén en
   openapi.json. Verificá las APIs de terceros que incorpores en Context7 o
   documentación oficial para la versión utilizada. Los tests se limitan a lo que pide §3
   del PRD.
4. Validación: cada punto de "Cerrar cuando" queda verificado con evidencia que ejecutaste
   (test, comando o prueba contra producción) o asignado a mí con los pasos exactos para
   verificarlo. Typecheck, lint y build pasan. Lo que dependa de un push, un deploy o un
   paso de "Hacer (usuario)" pendiente queda asignado a mí, y la fase sigue abierta hasta
   que lo confirme.
5. Documentación: con /writing-for-agents, agregá a fases/fase-N.md, después de
   "Definición", el registro con lo implementado, las decisiones técnicas que tomaste y su
   motivo, las validaciones ejecutadas y los desvíos respecto de lo acordado. Actualizá
   fases/README.md con estado, enlaces, pendientes y el siguiente trabajo con qué leer.
   Actualizá el PRD si cambiaron reglas. En AGENTS.md agregá solo
   gotchas que no se deducen del código, de package.json ni del PRD; lo que ya dicen el PRD
   o estos prompts se referencia, no se copia.
6. Creá un commit local con solo los cambios de la fase trabajada, aunque queden
   criterios asignados a mí. Terminá con la lista de lo que tengo que hacer a mano, en
   el orden en que conviene hacerlo.
```

## 6.3 Revisión

```text
Review this session for improvements in the following categories. Base each
finding on evidence from the session. Omit categories without findings, and
present proposed changes before implementing them in order of severity.

- **Navigation**: how easy was it for the agent to find the right files? Are there hidden dependencies between files? Would a navigation pointer make it easier?
- **Automated checks**: are there automated checks that could catch errors the agent made? Linting, typing, tests? Start from the repo's existing guardrails so a check that exists but sits unwired or silently broken is the finding, not a reinvention.
- **Coding standards**: did the implementing agent break a repo convention, or have to infer one that isn't written down? Mechanical violations get a deterministic check; reserve written standards for genuine judgement calls.
```

## 6.4 Loop sin supervisión

`scripts/loop-fases.ps1` corre 6.1 y después 6.2 para cada fase, cada prompt en una sesión
`claude -p` nueva, y les agrega al final este bloque. Cada sesión es una iteración: una fase y un
prompt, sin contexto previo; lo único que pasa a la siguiente es lo commiteado (el PRD,
`fases/README.md` y `fases/fase-N.md`). Si `fase-N.md` ya tiene `FN-D1`, el script saltea 6.1. El
modelo es el de la configuración de Claude Code y el esfuerzo lo fija el script (`medium`);
mientras corre, Windows no se suspende. 6.3 no corre en el loop. El script lee de este archivo los
bloques 6.1, 6.2 y 6.4: editarlos acá cambia el loop.

```text
Modo loop: corrés sin supervisión y nadie va a responder. Estas reglas prevalecen sobre los
pasos de arriba que piden consultar o esperar al usuario.

- Una iteración: esta sesión cubre solo la fase N y solo el prompt de arriba. Al commitear,
  terminá; no sigas con otra fase ni con el prompt siguiente, que el script lanza en una sesión
  nueva. Todo lo que esa sesión necesite saber tiene que quedar escrito en fases/README.md o
  fases/fase-N.md, no en tu respuesta final.
- Producto intacto: decidí vos todo lo técnico. Cuando una elección toque una regla de
  producto, el contrato del backend o el alcance de la fase, elegí la opción que deja el
  producto como lo definen el PRD y el sitio actual. Si ninguna lo deja intacto, no la
  implementes: anotala en "Decisiones para el usuario" de fases/README.md, con alternativas y
  recomendación, y seguí con lo que no depende de ella. Lo que un paso pida proponer al
  usuario va a esa misma sección.
- Dependencias: una fase "🔎 Implementada" cuenta como cumplida. Si una dependencia de N sigue
  "⏳ Pendiente", terminá la sesión sin cambios y explicá por qué.
- Validación local: verificá contra el backend local como indica AGENTS.md, con llamadas a la
  API, los tests de §3 del PRD y typecheck, lint y build. Lo visual (un error en su campo, el
  foco, las etapas de la galería) y lo que pida producción, un push, un deploy o un paso de
  "Hacer (usuario)" va, con los pasos exactos, a la sección "Verificaciones del usuario" al
  final de fases/fase-N.md, con su enlace en la lista de "Verificaciones del usuario" de
  fases/README.md.
- Estado: al cerrar 6.2, marcá N en la tabla de fases/README.md como "🔎 Implementada (fecha)"
  si le quedan verificaciones del usuario, o "✅ Cerrada (fecha)" si no.
- Límites: sin git push, sin deploys y sin cambios en ../elcauquen-backend, que solo se lee.
- Respuesta final: va a un log. Alcanza con el commit y si la fase quedó implementada, preparada
  o qué la bloqueó; lo demás ya está en los archivos.
```
