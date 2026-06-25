# Informe de avance — Bosque Mágico

**Para:** Gerencia  
**Versión:** 1.5  
**Fecha:** 2026-06-24  
**Producto:** Sistema comercial Bosque Mágico (landing + panel CRM + API)

---

## 1. Resumen ejecutivo

Se entregó y **validó en sandbox** un **MVP comercial completo** ampliado con **capacidades operativas** (pedidos a proveedores, checklist por evento y vista Operaciones). El equipo ya puede:

- Recibir solicitudes desde la **landing pública** o registrarlas **manualmente** en el panel.
- Gestionar leads en **Solicitudes**, con seguimiento, cierre y edición de datos de contacto.
- Armar, enviar y hacer seguimiento de **cotizaciones** (WhatsApp, correo, link público, PDF).
- Obtener **aceptación del cliente** por link público, lo que genera automáticamente el **evento** en agenda.
- Operar la **agenda** (confirmar, realizar o cancelar eventos) con vista calendario mensual.
- Gestionar **pedidos operativos** vinculados al evento (shows, catering, decoración, etc.) y verlos consolidados en **Operaciones**.
- Mantener **proveedores** y productos de origen externo en **Configuración**.
- Ejecutar **checklist** de tareas por evento confirmado.
- Generar, enviar e imprimir **contratos** vinculados al evento (PDF con términos, adelantos y snapshot de la cotización).
- Consultar el **historial por cliente** (identidad por celular/correo).
- Configurar **tarifas, turnos, catálogo y proveedores** sin redeploy.
- Administrar **usuarios y permisos** (solo rol admin).

El sistema está desplegado en **entorno sandbox** para pruebas reales del equipo. La **Fase 8 del panel** está **completada**. Entre el **17/06** y el **24/06/2026** se incorporaron **cinco fases operativas** (anticipación, contrato previo a agenda, adjuntos, media catálogo, postventa) y se validaron con **`qa:fases` 27/27** más la batería previa smoke **20/20**, flujo **30/30**, negativos **5/5**, pedidos **18/18** (ver [03-PRUEBAS-Y-QA.md](./03-PRUEBAS-Y-QA.md)).

**Cambio de proceso clave (jun 24):** ya **no** se confirma un evento en agenda hasta tener **contrato enviado o firmado** y **pedidos de proveedor confirmados** (incluye link público para el proveedor).

**Fuera del alcance actual (decisión de producto):** pagos en línea y registro de abonos, firma electrónica legal, integración Meta Lead Ads automatizada, reportes exportables y postventa operativa. La **cobranza** sigue siendo manual fuera del sistema.

---

## 2. Objetivos del proyecto

### 2.1 Objetivos de negocio

| Objetivo | Cómo se cumple hoy |
|----------|-------------------|
| Un solo lugar para gestionar interesados en fiestas | Panel CRM: Solicitudes, Cotizaciones, Agenda, Operaciones, Clientes |
| No perder leads de la web | Landing con cotizador → API crea solicitud (y borrador de cotización si el payload es completo) |
| Respuesta comercial más rápida | Borrador automático desde landing; acciones WhatsApp/correo en una fila; detalle en modal |
| Trazabilidad del recorrido comercial | Bitácora de auditoría en solicitudes y cotizaciones; estados claros |
| Evitar tratar al mismo contacto como personas distintas | Módulo Clientes con reconocimiento por celular/correo y alerta de duplicado reciente (24 h) |
| Separar lo vendido de lo que sigue en negociación | Cotización aceptada → evento en agenda → contrato opcional → pedidos operativos |
| Coordinar logística con proveedores externos | Pedidos auto-generados desde ítems de cotización con producto `origen=proveedor`; vista Operaciones por semana |

### 2.2 Objetivos técnicos

| Objetivo | Implementación |
|----------|----------------|
| Producto web independiente y escalable | Monorepo: `apps/landing`, `apps/panel`, `apps/api` |
| Reglas de negocio centralizadas | NestJS + `CalculoPreciosService` |
| Base de datos propia del dominio | PostgreSQL con tablas del módulo Bosque |
| Seguridad básica | JWT en panel, rate limit en endpoint público, permisos `view` / `manage` / `admin` |
| Operación en sandbox antes de producción | Docker Compose + URLs públicas de API, panel y landing |
| Calidad reproducible | Scripts `qa:smoke`, `qa:flujo`, `qa:fases`, `qa:operaciones`, `db:cleanup` |
| Código compartido panel/landing | Paquete `packages/shared` (`contrato-print.ts`) |

### 2.3 Principio de diseño (gentle-ai)

El sistema **asiste al vendedor** sin automatismos opacos: estados visibles simples, acciones explícitas (tomar, enviar, aceptar, confirmar) y registro en bitácora. La complejidad del CRM prototipo PHP se simplificó en la interfaz sin perder trazabilidad en backend.

---

## 3. Alcance entregado vs. pendiente

### 3.1 Entregado (MVP + Fase 8 + Contratos + Operaciones)

```mermaid
flowchart TB
  subgraph Captación
    L[Landing + cotizador]
    M[Solicitud manual panel]
  end
  subgraph Comercial
    S[Solicitudes / leads]
    C[Cotizaciones]
    CL[Clientes]
  end
  subgraph Operación
    A[Agenda / eventos]
    OP[Operaciones / pedidos]
    PV[Proveedores]
    CT[Contratos]
    CFG[Configuración]
    USR[Usuarios admin]
  end
  L --> S
  M --> S
  S --> C
  C -->|Aceptada| A
  A --> OP
  A --> CT
  PV --> OP
  C -->|Ítems proveedor| OP
  S --> CL
  C --> CL
```

| Área | Entregado |
|------|-----------|
| Landing pública | Cotizador, catálogo desde API, SEO, link público de cotización |
| Solicitudes | Listado, filtros, tomar, seguimiento, cerrar, editar lead, duplicados, bitácora |
| Cotizaciones | Crear, editar borrador, enviar WA/correo, PDF, link público, aceptar desde panel |
| Agenda | Vista mes (default) y lista, confirmar, realizar, cancelar; TZ Lima; deep link `?detalle=` |
| **Operaciones** | Listado de pedidos por rango de fechas, costo estimado, enlace a evento |
| **Pedidos por evento** | CRUD en detalle de evento; generación desde cotización; estados operativos |
| **Checklist** | Tareas por evento; plantillas por área; progreso completadas/total |
| **Proveedores** | CRUD en Configuración; vinculación a productos y pedidos |
| Contratos | Generar desde evento, PDF imprimible, enviar WhatsApp, estados Borrador → Enviado → Firmado |
| Clientes | Ficha consolidada, historial, contacto WA/correo |
| Configuración | Tarifas, turnos editables, catálogo productos con imagen, proveedores |
| Panel UX Fase 8 | Filtros en tablas, paginado, WebSocket + campana, modales unificados, sidebar colapsable |
| **Panel UX (jun 24)** | Columna **Registro** primera; selector filas 20–200; notificaciones leídas por usuario; campana marrón con pendientes |
| Dashboard | KPIs por estado de solicitud; próximos eventos con fecha legible y enlace a agenda |
| **Anticipación mínima (F1)** | Config `solicitud.min_dias_anticipacion` (default 7 días) en landing y validación API |
| **Precondiciones agenda (F2)** | Contrato Enviado/Firmado + pedidos proveedor confirmados antes de **Confirmar evento** |
| **Pedido público proveedor** | `/pedido/:token` confirmar o rechazar sin login |
| **Adjuntos contrato (F3)** | Comprobante de pago y documento contabilidad (multipart, drag & drop en panel) |
| **Media catálogo (F4)** | Galería imágenes + video URL; expuesto en API pública de catálogo |
| **Postventa (F5)** | Toggle `postventa.habilitado` + URL formulario; hook al marcar evento realizado |
| Calidad | Tests unitarios; smoke 20/20; flujo **30/30**; **`qa:fases` 27/27**; negativos 5/5; pedidos 18/18 |
| **Contrato público (landing)** | Vista `/contrato/:token` y PDF público consultable por el cliente |
| **Envío cotización por correo** | Modal con plantilla, link aceptar + link PDF; SMTP automático o cliente de correo |
| **`packages/shared`** | Impresión/PDF de contrato unificada entre panel y landing |
| Sandbox | Stack desplegable; deploy API sin re-seed base en cada arranque |

### 3.2 Pendiente (fases posteriores)

| Tema | Motivo de postergación |
|------|------------------------|
| Meta Lead Ads + WhatsApp automatizado (n8n / YCloud) | Propuesta documentada en `.docs/doc-n8n/`; ver [06-ROADMAP-INTEGRACIONES.md](./06-ROADMAP-INTEGRACIONES.md) |
| Rediseño ítems incluidos por paquete (Básico/Estándar/Premium) | Requiere acuerdo comercial; claves `paquetes.*` en config como base |
| Carousel landing — transición automática entre imágenes | Galería implementada; auto-play en card pendiente de pulir |
| Pagos y cobranza en sistema | Complejidad financiera; adelantos en contrato son referenciales |
| Cierre formal de cotización con motivo | Mejora de proceso; hoy se cierra vía solicitud o estados |
| Dashboard KPIs avanzados | Resumen básico existe; reportes gerenciales en fase siguiente |
| Exportación de auditoría / reportes | Operación diaria no lo exige aún |
| E2E automatizado del panel | Smoke y `qa:flujo` cubren API; UI manual documentada |
| Firma electrónica legal del contrato | Se marca **Firmado** manualmente |
| Notificaciones automáticas a proveedores | Pedidos se gestionan en panel; contacto WA manual |

---

## 4. Casos de uso cubiertos

### 4.1 Matriz resumida

| # | Caso de uso | Actor | Resultado |
|---|-------------|-------|-----------|
| CU-01 | Cliente cotiza en la web | Cliente / landing | Solicitud creada; opcional borrador de cotización |
| CU-02 | Vendedor registra interés por teléfono | Operador | Solicitud manual en panel |
| CU-03 | Vendedor toma y da seguimiento a un lead | Operador | Estado En atención + notas y próximo contacto |
| CU-04 | Vendedor edita datos del contacto | Operador | PATCH solicitud (modal Solicitud) |
| CU-05 | Sistema detecta posible duplicado | Sistema | Flag en solicitud (misma identidad &lt; 24 h) |
| CU-06 | Vendedor arma y envía cotización | Operador | Borrador → Enviada; mensaje WA o correo |
| CU-07 | Cliente revisa y acepta cotización en línea | Cliente | Cotización Aceptada + evento Por confirmar |
| CU-08 | Vendedor acepta cotización en nombre del cliente | Operador | Mismo resultado que CU-07 |
| CU-09 | Operación confirma y cierra el evento | Operador | Requiere contrato + proveedores OK → Confirmado → Realizado |
| CU-10 | Consultar historial de un contacto recurrente | Operador | Módulo Clientes |
| CU-11 | Admin ajusta tarifas, turnos, catálogo o proveedores | Admin | Configuración persistida en BD |
| CU-12 | Admin gestiona usuarios del panel | Admin | CRUD en `/usuarios` |
| CU-13 | Vendedor genera contrato desde evento aceptado | Operador | Contrato en borrador con snapshot de cotización |
| CU-14 | Vendedor envía contrato e imprime PDF | Operador | WhatsApp + PDF; estado Enviado |
| CU-15 | Vendedor marca contrato firmado | Operador | Estado Firmado |
| **CU-16** | **Operación genera pedidos desde cotización** | **Operador** | **Pedidos por ítem proveedor al confirmar evento** |
| **CU-17** | **Operación gestiona pedidos semanales** | **Operador** | **Vista Operaciones con filtro de fechas y costo total** |
| **CU-18** | **Operación ejecuta checklist del evento** | **Operador** | **Tareas pendiente → completado en detalle de evento** |
| **CU-19** | **Cliente consulta contrato en landing** | **Cliente** | **Link público `/contrato/:token` + PDF** |
| **CU-20** | **Vendedor envía cotización por correo (SMTP o manual)** | **Operador** | **Modal con asunto, cuerpo y links; estado Enviada** |
| **CU-21** | **Sistema valida anticipación mínima** | **Sistema** | Rechaza fecha &lt; N días (`solicitud.min_dias_anticipacion`) |
| **CU-22** | **Operación genera y envía contrato antes de agenda** | **Operador** | Contrato Borrador → Enviado; bloquea confirmar si falta |
| **CU-23** | **Proveedor confirma pedido por link público** | **Proveedor** | `/pedido/:token` → pedido Confirmado o Cancelado |
| **CU-24** | **Operación adjunta comprobante y documento contable** | **Operador** | Archivos en contrato; gestión al editar |
| **CU-25** | **Admin configura galería y video de producto** | **Admin** | Imágenes + `videoUrl` en catálogo y landing |
| **CU-26** | **Sistema envía postventa al realizar evento** | **Sistema** | Si `postventa.habilitado` y URL configurada |
| **CU-27** | **Usuario marca notificaciones como leídas** | **Operador** | Persistencia por usuario en campana del panel |

### 4.2 Caso crítico: de la landing a la operación del evento

1. **Landing:** el cliente completa el cotizador y envía.
2. **API:** crea solicitud; si el payload trae paquete, fecha, turno y niños, genera **cotización en borrador**.
3. **Panel — Solicitudes:** el equipo ve la solicitud (Nueva), la toma, revisa datos y contacta.
4. **Panel — Cotizaciones:** revisa o edita el borrador, **envía** por WhatsApp o correo (Enviada).
5. **Landing — link público:** el cliente abre `/cotizacion/:token` y **acepta**.
6. **Sistema:** cotización Aceptada + **evento** en agenda (Por confirmar).
7. **Panel — Agenda:** generar **contrato** → enviar PDF/WhatsApp → marcar **Enviado** (o Firmado).
8. **Panel — Agenda:** **Generar desde cotización** (pedidos proveedor) → compartir link público al proveedor → esperar **Confirmado**.
9. **Panel — Agenda:** **Confirmar evento** (solo si contrato + pedidos OK) → **checklist** y logística.
10. **Panel — Operaciones:** revisar pedidos de la semana, costos y estado.
11. **Panel — Agenda:** adjuntar comprobante/contabilidad si aplica; al terminar la fiesta → **marcar realizado** (postventa opcional).

```mermaid
sequenceDiagram
  participant C as Cliente
  participant L as Landing
  participant API as API NestJS
  participant P as Panel operador
  C->>L: Completa cotizador
  L->>API: POST solicitud pública
  API-->>P: Solicitud (+ borrador opcional)
  P->>API: Tomar / editar / enviar cotización
  API-->>C: Link público (WA o correo)
  C->>L: Aceptar cotización
  L->>API: POST aceptar
  API-->>P: Evento en agenda
  P->>API: Generar y enviar contrato
  P->>API: Pedidos proveedor + link público
  P->>API: Confirmar evento (precondiciones OK)
  P->>API: Checklist / realizar evento
```

---

## 5. Flujos de negocio

### 5.1 Estados visibles (simplificados para el equipo)

En pantalla se habla de **Estado** (en base de datos el campo técnico sigue llamándose `etapa`).

| Módulo | Estados | Significado para gerencia |
|--------|---------|---------------------------|
| **Solicitud** | Nueva → En atención → Cotizada → Cerrada | Embudo comercial del lead |
| **Cotización** | Borrador → Enviada → Aceptada → Cerrada | Ciclo de la propuesta |
| **Evento** | Por confirmar → Confirmado → Realizado / Cancelado | Ejecución de la fiesta vendida |
| **Contrato** | Borrador → Enviado → Firmado / Anulado | Documento formal post-venta |
| **Pedido** | Pendiente → Solicitado → Confirmado → En proceso → Entregado → Cerrado / Cancelado | Logística con proveedores o áreas internas |
| **Tarea (checklist)** | Pendiente → En proceso → Completado / Bloqueado | Preparación operativa del evento |

### 5.2 Flujo comercial + operativo

```mermaid
flowchart LR
  A[Captación] --> B[Solicitud Nueva]
  B --> C[En atención]
  C --> D{Cotiza?}
  D -->|Sí| E[Cotización]
  E --> F[Enviada al cliente]
  F --> G{Acepta?}
  G -->|Sí| H[Evento en agenda]
  G -->|No| I[Cerrar lead]
  H --> L[Contrato + pedidos proveedor]
  L --> J[Confirmado en agenda]
  J --> M[Checklist + operaciones]
  M --> K[Realizado + postventa opcional]
  D -->|No| I
```

### 5.3 Identidad del cliente

- Un **cliente** agrupa solicitudes y cotizaciones por **celular o correo**.
- La landing y las solicitudes nuevas **vinculan o crean** ese registro automáticamente.

### 5.4 Reglas de negocio relevantes

| Regla | Comportamiento |
|-------|----------------|
| Precios | Calculados en backend según tarifas, día, paquete, niños e ítems |
| Doble reserva | Al aceptar cotización se valida slot **fecha + turno** |
| Link público | Solo permite aceptar si la cotización está **Enviada** |
| Anticipación | Fecha evento debe ser ≥ hoy + `min_dias_anticipacion` (configurable, default 7) |
| Pedidos | Generables en **Por confirmar**; confirmación de evento exige pedidos proveedor **Confirmados** |
| Confirmar agenda | Requiere contrato **Enviado o Firmado** + pedidos proveedor sin pendientes |
| Contrato por evento | Máximo un contrato activo; requiere cotización **Aceptada**; adjuntos opcionales post-envío |
| Código correlativo | `COT-NNNNN` atómico en BD (fix `COT-00NaN`) |
| Duplicado reciente | Misma identidad con solicitud en las últimas 24 h → alerta |

---

## 6. Arquitectura del sistema

### 6.1 Vista de componentes

```mermaid
flowchart TB
  subgraph Cliente_final
    Landing["Landing React (Vite)<br/>SEO, cotizador, /cotizacion/:token"]
  end
  subgraph Equipo_interno
    Panel["Panel React (Vite)<br/>CRM + operaciones"]
  end
  subgraph Servidor
    API["API NestJS<br/>REST + Socket.IO"]
    PG[(PostgreSQL)]
  end
  Landing -->|Público sin login| API
  Panel -->|JWT| API
  API --> PG
```

### 6.2 Estructura del repositorio

```text
proyecto-bosque-magio/
├── apps/
│   ├── api/       NestJS, Prisma, dominio Bosque Mágico
│   ├── panel/     CRM interno (React 19, TanStack Query/Table)
│   └── landing/   Web pública (React, cotizador, cotización pública)
├── packages/
│   └── shared/    Tipos y utilidades compartidas (ej. contrato-print)
├── .docs/         Planificación, flujos, informes de entrega
├── scripts/       QA smoke, flujo paso a paso, operaciones demo
└── docker-compose.sandbox.yml
```

### 6.3 Modelo operativo (nuevo jun 2026)

| Entidad | Propósito |
|---------|-----------|
| `Proveedor` | Contacto externo (shows, catering, etc.) |
| `Pedido` | Orden operativa ligada a un evento (área, costo, etapa, proveedor opcional) |
| `TareaEvento` | Ítem de checklist por evento (área operaciones, decoración, etc.) |

Los productos del catálogo pueden marcarse como `origen=proveedor` y vincularse a un proveedor; al confirmar el evento, el sistema puede crear pedidos automáticamente desde los ítems de la cotización aceptada.

### 6.4 Seguridad y permisos

| Rol / permiso | Capacidades |
|---------------|-------------|
| `view` | Consultar solicitudes, cotizaciones, agenda, clientes, operaciones |
| `manage` | Crear/editar operación comercial, catálogo, proveedores (sin tarifas) |
| `admin` | Configuración de tarifas y turnos, usuarios, todo lo anterior |

---

## 7. Módulos del panel (capacidades)

| Módulo | Rol en el negocio | Capacidades clave |
|--------|-------------------|-------------------|
| **Dashboard** | Vista rápida | KPIs por estado de solicitud; próximos eventos con enlace a agenda |
| **Solicitudes** | Leads | Filtros, tomar, seguimiento, cerrar, editar lead, crear cotización, bitácora |
| **Cotizaciones** | Propuesta comercial | Borrador, enviar, PDF, link, aceptar, bitácora |
| **Agenda** | Evento vendido | Calendario mes/lista, confirmar / realizar / cancelar, pedidos, checklist, contrato |
| **Operaciones** | Logística semanal | Pedidos por rango de fechas, costo estimado, salto a evento |
| **Contratos** | Formalización | Listado, PDF, WhatsApp, marcar enviado/firmado |
| **Clientes** | Memoria comercial | Historial, frecuencia, contacto directo |
| **Configuración** | Reglas y catálogo | Tarifas, turnos, productos, **proveedores** |
| **Usuarios** | Gobierno de acceso | Solo admin |

---

## 8. Avances recientes (hasta 24 jun 2026)

| Fecha / hito | Entrega |
|--------------|---------|
| Flujo comercial panel + landing | Integración completa solicitud → cotización → agenda |
| Sandbox | Despliegue Docker con URLs públicas |
| Módulo Contratos (2026-06-10) | PDF, WhatsApp, estados Borrador/Enviado/Firmado |
| Proveedores + Pedidos (2026-06-15) | CRUD proveedores; pedidos en evento; vista Operaciones |
| Batería QA ampliada (17–18/06) | Smoke 20/20, flujo **30/30**, negativos 5/5, pedidos 18/18 |
| **F1 Anticipación (24/06)** | `solicitud.min_dias_anticipacion`; validación landing y API |
| **F2 Contrato + proveedor previo agenda (24/06)** | `PrecondicionesEventoService`; pedido público `/pedido/:token` |
| **F3 Adjuntos contrato (24/06)** | Comprobante pago + documento contabilidad |
| **F4 Media catálogo (24/06)** | Galería imágenes + video URL en productos y API pública |
| **F5 Postventa (24/06)** | Toggle + URL formulario; hook al realizar evento |
| **`packages/shared` (24/06)** | `contrato-print.ts` unificado panel/landing |
| **Notificaciones persistidas (24/06)** | `panel_notificaciones`; campana marrón con no leídas |
| **UX tablas (24/06)** | Columna Registro; page size 20/40/60/100/200 |
| **Fixes (24/06)** | COT secuencial atómico; modal +Pedido; charset nginx en deploy |
| **`qa:fases` (24/06)** | Script nuevo — **27/27 OK** |
| **Deploy sandbox** | Entrypoint API omite re-seed en cada arranque |

---

## 9. Entornos disponibles

### 9.1 Desarrollo local

| Servicio | URL típica |
|----------|------------|
| API | `http://localhost:3000/api` (Swagger: `/api/docs`) |
| Panel | `http://localhost:5174` |
| Landing | `http://localhost:5173` |

Credencial tras seed: `admin@bosquemagico.test` / `BosqueDev123!`

### 9.2 Sandbox (pruebas del equipo)

| Servicio | URL |
|----------|-----|
| API | `https://sandbox-api-bosque.gcbprojects.site/api` |
| Panel | `https://sandbox-panel-bosque.gcbprojects.site` |
| Landing | `https://sandbox-landing-bosque.gcbprojects.site` |

**Credencial sandbox (VPS actual):** `admin@bosquemagico.test` / `admin@@@`  
_(El `docker-compose.sandbox.yml` declara `BosqueDev123!` pero el seed en VPS dejó `admin@@@`.)_

---

## 10. Indicadores de madurez

| Criterio | Estado |
|----------|--------|
| Flujo comercial de punta a punta | ✅ Operativo |
| Flujo operativo (pedidos + checklist) | ✅ Operativo (MVP) |
| Contratos PDF + seguimiento | ✅ Operativo |
| Reglas de precio en servidor | ✅ Con tests unitarios |
| Trazabilidad (auditoría) | ✅ En solicitud y cotización |
| UX unificada en panel | ✅ Fase 8 cerrada |
| Prueba automatizada API (smoke + flujo 30 + fases 27 + negativos + pedidos) | ✅ |
| Prueba E2E UI automatizada | ⬜ Pendiente |
| Producción final (dominio cliente) | ⬜ Siguiente decisión de go-live |

---

## 11. Resultados QA (17–24 jun 2026)

Resumen de validación en **local dev**:

| Script | Resultado | Última corrida |
|--------|-----------|----------------|
| `qa:smoke` | **20/20 OK** | 24/06 |
| `qa:flujo` | **30/30 OK** (flujos A, B, C + cierre) | 18/06 |
| `qa:negativos` | **5/5 OK** | 18/06 |
| `qa:pedidos` | **18/18 OK** | 18/06 |
| `qa:operaciones` | **OK** | 18/06 |
| **`qa:fases`** | **27/27 OK** (F1–F5) | **24/06** |
| `npm run build` | **OK** (api + panel + landing) | 18/06 |

| Flujo | Correo | Resultado |
|-------|--------|-----------|
| A (landing → WA) | germanhuaytalla22@gmail.com | Cotización `COT-00001` enviada |
| B (manual E2E) | germanhuaytalla23@gmail.com | Evento realizado + checklist + pedidos |
| C (landing + contrato público) | refugiogastronomico8222@gmail.com | Contrato público consultable |
| Cierre | lead descartable | Cerrada `sin_respuesta` |

**Celular unificado en pruebas:** `910139973` (`QA_CELULAR`).

Detalle completo, comandos y hallazgos: [03-PRUEBAS-Y-QA.md](./03-PRUEBAS-Y-QA.md).

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación actual |
|--------|-------------------|
| Lead duplicado por reenvío en landing | Alerta `posibleDuplicado` + módulo Clientes |
| Doble reserva de fecha/turno | Validación al aceptar cotización |
| Spam en formulario público | Rate limit en API |
| Pedidos olvidados antes del evento | Vista Operaciones por semana + checklist |
| Dependencia de WhatsApp manual | Modal de revisión de mensaje; preapertura de pestaña |

---

## 13. Recomendaciones para gerencia

### 13.1 Uso inmediato del sandbox

1. Asignar 2–3 personas del equipo comercial para el **checklist manual** en [03-PRUEBAS-Y-QA.md](./03-PRUEBAS-Y-QA.md).
2. **Demo para gerencia (flujo A):** [04-EJEMPLO-REAL-GERMAN22-GERENCIA.md](./04-EJEMPLO-REAL-GERMAN22-GERENCIA.md) con `germanhuaytalla22@gmail.com`.
3. **Demo contrato público (flujo C):** [05-EJEMPLO-FLUJO-C-CONTRATO-PUBLICO.md](./05-EJEMPLO-FLUJO-C-CONTRATO-PUBLICO.md) con `refugiogastronomico8222@gmail.com`.
4. Ejecutar batería local antes de reunión: `npm run db:cleanup:operativo` + scripts `qa:*` (ver §6 de QA).
5. Recoger feedback sobre textos, tiempos y campos faltantes antes del go-live.

### 13.2 Orden operativo sugerido

1. **Solicitudes** — priorizar lo nuevo (validar anticipación mínima).  
2. **Cotizaciones** — enviar y dar seguimiento.  
3. **Agenda (Por confirmar)** — generar **contrato** → enviar → pedidos proveedor → confirmación proveedor.  
4. **Agenda** — **Confirmar evento** solo cuando contrato y proveedores estén OK.  
5. **Operaciones** — revisar pedidos de la semana y costos.  
6. **Contratos** — adjuntar comprobante/contabilidad; marcar firmado si aplica.  
7. **Agenda** — checklist; el día → **marcar realizado** (postventa si está activa).  
8. **Clientes** — contexto en recompras.

### 13.3 Próximas inversiones (prioridad negocio)

| Prioridad | Tema | Valor |
|-----------|------|-------|
| Alta | Go-live producción (dominio, SSL, backups) | Uso real con clientes |
| Media | KPIs en dashboard | Control gerencial |
| Media | Meta Lead Ads → WhatsApp (n8n / YCloud) | Ver [06-ROADMAP-INTEGRACIONES.md](./06-ROADMAP-INTEGRACIONES.md) |
| Media | Rediseño ítems incluidos por paquete | Alinear reglas Básico/Estándar/Premium |
| Media | Notificación a proveedores desde pedido | Menos seguimiento manual |
| Baja | Módulo de pagos | Cuando contratos estén estables |

---

## 14. Temas en seguimiento (post-QA 24/06)

| Tema | Estado | Nota |
|------|--------|------|
| Rediseño lógica ítems por paquete | 🔍 Diseño | Matriz Básico/Estándar/Premium — ver roadmap §4 |
| Carousel landing auto-play | 🔍 UX | Galería OK; transición automática en card por pulir |
| Batería QA «todos los CU» | 🔄 En curso | F1–F5 en `qa:fases`; ampliar cobertura UI |
| Notificación automática correo proveedor | ⬜ Parcial | Clave config existe; depende SMTP producción |
| Adelanto referencial si cotización &lt; S/ 500 | ⬜ Decisión negocio | Regla en contrato por confirmar |

### Resueltos desde 17/06

| Tema | Estado |
|------|--------|
| Código cotización `COT-00NaN` | ✅ Correlativo atómico en BD |
| Modal **+ Pedido** en detalle de evento | ✅ Corregido |
| Caracteres corruptos (encoding) | ✅ Charset nginx en deploy |

---

## 15. Referencias

| Documento | Ubicación |
|-----------|-----------|
| Manual operario (detalle paso a paso) | `.docs/entrega-2026-06-24/02-MANUAL-OPERARIO.md` |
| **Demo gerencia (caso german22)** | `.docs/entrega-2026-06-24/04-EJEMPLO-REAL-GERMAN22-GERENCIA.md` |
| **Demo flujo C (contrato público)** | `.docs/entrega-2026-06-24/05-EJEMPLO-FLUJO-C-CONTRATO-PUBLICO.md` |
| **Roadmap integraciones** | `.docs/entrega-2026-06-24/06-ROADMAP-INTEGRACIONES.md` |
| Pruebas y QA | `.docs/entrega-2026-06-24/03-PRUEBAS-Y-QA.md` |
| Flujos y guía operativa base | `.docs/BOSQUE_FLUJOS_Y_GUIA_USO.md` |
| Estado por módulo | `.docs/MODULOS_ESTADO.md` |
| Bitácora QA junio | `.docs/PRUEBAS_FLUJO_JUNIO_2026.md` |

---

*Documento preparado para comunicación interna de avance. Versión 1.5 — 2026-06-24.*
