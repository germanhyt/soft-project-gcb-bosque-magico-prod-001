# Pruebas y QA — Bosque Mágico

**Versión:** 1.0  
**Fecha:** 2026-06-15  
**Alcance:** Entornos local y sandbox VPS

Este documento consolida la estrategia de pruebas, scripts automatizados, flujos paso a paso y checklist de verificación manual en panel y landing.

---

## 1. Resumen de cobertura

| Tipo | Script / método | Qué valida |
|------|-----------------|------------|
| Smoke API | `npm run qa:smoke` | Salud, auth, catálogo, solicitudes mock, E2E comercial API |
| Flujo paso a paso | `npm run qa:flujo` | 21 pasos con correos german (landing + manual + cierre) |
| Operaciones demo | `npm run qa:operaciones` | Seed demo + pedidos + tareas checklist |
| Limpieza QA | `npm run db:cleanup` | Borra datos demo/QA sin afectar correos german |
| UI manual | Checklist §6 | Panel + landing en navegador |

---

## 2. Preparación de entorno

### 2.1 Local

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run db:seed:demo
```

Levantar servicios:

```bash
npm run dev:api      # puerto 3000
npm run dev:panel    # puerto 5174
npm run dev:landing  # puerto 5173
```

**Credenciales local:** `admin@bosquemagico.test` / `BosqueDev123!`

Limpieza opcional antes de pruebas repetidas:

```bash
npm run db:cleanup
```

### 2.2 Sandbox VPS

| Servicio | URL |
|----------|-----|
| API | `https://sandbox-api-bosque.gcbprojects.site/api` |
| Panel | `https://sandbox-panel-bosque.gcbprojects.site` |
| Landing | `https://sandbox-landing-bosque.gcbprojects.site` |

**Credenciales sandbox:** `admin@bosquemagico.test` / `admin@@@`

Verificar contenedores en VPS:

```bash
docker compose -f docker-compose.sandbox.yml ps
```

Si la landing muestra **Network Error** o no carga catálogo:

```bash
bash scripts/sandbox-repair.sh
```

---

## 3. Scripts automatizados

### 3.1 Smoke test (`qa-smoke-use-cases.mjs`)

```bash
npm run qa:smoke
```

Valida:

1. `/health`
2. `/auth/status`
3. Login + `/auth/me`
4. Configuración y catálogo público
5. Crear solicitud pública (mock)
6. Crear solicitud manual (autenticado)
7. Listar solicitudes, cotizaciones, eventos, clientes
8. Configuración privada panel
9. **E2E comercial API:** tomar → editar → cotizar → enviar → aceptar → confirmar → realizar

**Sandbox (Git Bash):**

```bash
QA_API_URL="https://sandbox-api-bosque.gcbprojects.site/api" \
QA_EMAIL="admin@bosquemagico.test" \
QA_PASSWORD="admin@@@" \
npm run qa:smoke
```

**Sandbox (PowerShell):**

```powershell
$env:QA_API_URL="https://sandbox-api-bosque.gcbprojects.site/api"
$env:QA_EMAIL="admin@bosquemagico.test"
$env:QA_PASSWORD="admin@@@"
npm run qa:smoke
```

### 3.2 Flujo paso a paso (`qa-flujo-paso-a-paso.mjs`)

```bash
npm run db:cleanup    # opcional
npm run qa:flujo
```

**21 pasos** con correos reales de prueba (no se borran con cleanup):

- `germanhuaytalla22@gmail.com` — flujo landing
- `germanhuaytalla23@gmail.com` — flujo manual E2E completo
- Lead descartable `@example.test` — cierre solicitud

#### Flujo A — Landing → panel (`germanhuaytalla22@gmail.com`)

| Paso | Caso de uso | Endpoint / acción |
|------|-------------|-------------------|
| A1 | Solicitud pública (landing) | `POST /public/bosque-magico/solicitudes` |
| A2 | Listar y localizar por correo | `GET /bosque-magico/solicitudes?busqueda=...` |
| A3 | Tomar solicitud o verificar borrador auto | `POST .../tomar` o skip si `cotizada` |
| A4 | Editar seguimiento | `PATCH .../solicitudes/:id` |
| A5 | Cotización borrador (auto o manual) | `POST /bosque-magico/cotizaciones` |
| A6 | Enviar cotización (WhatsApp) | `POST .../cotizaciones/:id/enviar` |

Estado final A: cotización **enviada** (aceptación pendiente).

#### Flujo B — Manual → E2E (`germanhuaytalla23@gmail.com`)

| Paso | Caso de uso | Endpoint / acción |
|------|-------------|-------------------|
| B1 | Solicitud manual | `POST /bosque-magico/solicitudes` |
| B2 | Tomar solicitud | `POST .../tomar` |
| B3 | Cotización con ítem show | `POST /bosque-magico/cotizaciones` |
| B4 | Enviar por correo | `POST .../enviar` |
| B5 | Aceptar cotización | `POST .../aceptar` → crea evento |
| B6 | Confirmar evento | `POST .../eventos/:id/confirmar` |
| B7 | Checklist tareas | `GET .../eventos/:id/tareas` |
| B8 | Pedidos proveedor | `GET .../eventos/:id/pedidos` |
| B9 | Resumen dashboard | `GET .../eventos/resumen` |
| B10 | Marcar realizado | `POST .../realizar` |

#### Flujo C — Cerrar solicitud

| Paso | Caso de uso |
|------|-------------|
| C1 | Crear lead descartable |
| C2 | Cerrar con motivo `sin_respuesta` |

**Sandbox:**

```bash
QA_API_URL="https://sandbox-api-bosque.gcbprojects.site/api" \
QA_EMAIL="admin@bosquemagico.test" \
QA_PASSWORD="admin@@@" \
npm run qa:flujo
```

### 3.3 Operaciones demo (`qa-operaciones-demo.mjs`)

```bash
npm run qa:operaciones
npm run db:seed:demo        # recrear evento demo operaciones
```

Valida proveedor demo, pedidos en vista operaciones y tareas checklist del evento seed.

### 3.4 Limpieza demo/QA (`cleanup-demo.ts`)

```bash
npm run db:cleanup
```

Elimina (y datos derivados: eventos, pedidos, tareas, contratos, logs):

| Criterio | Ejemplos |
|----------|----------|
| `detalleOrigen = seed_demo` | Seed operaciones |
| Código `COT-DEMO*` | Cotizaciones demo |
| Correos `@example.test`, `@test.com`, `qa.*`, `*.demo@` | Smoke / QA |
| Nombres/notas con `Demo`, `QA`, `Smoke test` | Datos de prueba |

**No borra** solicitudes/cotizaciones con `germanhuaytalla22@gmail.com` ni `germanhuaytalla23@gmail.com`.

Clientes huérfanos demo (sin cotizaciones ni eventos) también se eliminan.

---

## 4. Correcciones validadas durante QA

### 4.1 Dashboard — «INVALID DATE»

**Problema:** En Dashboard → Próximos eventos, la fecha mostraba `INVALID DATE`.

**Causa:** `formatMesDia()` pasaba ISO completo (`2026-06-24T00:00:00.000Z`) a `formatMesDiaCalendario()`, que espera clave `YYYY-MM-DD`.

**Fix:** Extraer clave con `claveFechaCalendario(iso)` antes de formatear.

**Extra:** Los eventos del dashboard enlazan a `/agenda?detalle={id}`.

### 4.2 Colisión código cotización

**Problema:** Tras `db:cleanup` parcial, `generarCodigo()` colisionaba (`count()+1`).

**Fix:** Usar último código `COT-#####` + 1.

---

## 5. Resultados de ejecución

### 5.1 Local — 14/06/2026

**Limpieza (`npm run db:cleanup`):**

```
solicitudes: 10, cotizaciones: 8, logsMensaje: 5, clientesHuerfanos: 9
```

**Flujo (`npm run qa:flujo`):** **21/21 OK**

| Flujo | Correo | IDs generados |
|-------|--------|---------------|
| A (landing) | germanhuaytalla22@gmail.com | solicitud `927f3063-…`, cotización `28ad87a7-…` |
| B (E2E) | germanhuaytalla23@gmail.com | solicitud `71658883-…`, cotización `2bfcf451-…`, evento `65d58f8c-…` |
| C (cierre) | @example.test | solicitud `ffd8af91-…` |

### 5.2 Sandbox — 15/06/2026

**Flujo (`npm run qa:flujo`):** **21/21 OK**

| Flujo | Correo | IDs sandbox |
|-------|--------|-------------|
| A (landing) | germanhuaytalla22@gmail.com | solicitud `88396d0f-…`, cotización `257f014a-…` (enviada WA) |
| B (E2E) | germanhuaytalla23@gmail.com | solicitud `bc88b4c0-…`, cotización `53f82cbc-…`, evento `4edb2bdc-…` (realizado, 5 tareas) |
| C (cierre) | @example.test | solicitud `0430e045-…` cerrada `sin_respuesta` |

**Operaciones demo (VPS):**

- Proveedor demo: 1
- Pedidos en vista operaciones: 1
- Evento demo: `3e93e6ce-cf03-4f3a-9e57-967572e52737` — 1 pedido SHOW-MIMO + 5 tareas checklist

---

## 6. Checklist manual UI (panel + landing)

Ejecutar tras `npm run qa:flujo` o en sesión de prueba del equipo.

### 6.1 Landing

- [ ] Cotizador carga catálogo y configuración
- [ ] Envío de solicitud pública exitoso
- [ ] Mensaje de confirmación; sin errores en consola
- [ ] Link público de cotización: mensajes correctos en borrador / enviada / aceptada

### 6.2 Panel — General

- [ ] Login exitoso (sandbox: `admin@@@`)
- [ ] Indicador **En vivo** conectado
- [ ] Campana muestra notificaciones recientes

### 6.3 Dashboard

- [ ] KPIs cargan (Nueva, En atención, Cotizada, Cerrada)
- [ ] **Próximos eventos** muestra mes/día legible (ej. `JUN 24`, no INVALID DATE)
- [ ] Clic en evento abre Agenda con detalle

### 6.4 Solicitudes

- [ ] Listar, filtrar por estado y búsqueda
- [ ] `germanhuaytalla22@gmail.com` — cotizada/enviada
- [ ] `germanhuaytalla23@gmail.com` — cerrada vía flujo comercial
- [ ] Detalle modal: seguimiento, bitácora, editar solicitud
- [ ] Tomar, cerrar con motivo

### 6.5 Cotizaciones

- [ ] Flujo A: cotización enviada (22)
- [ ] Flujo B: cotización aceptada/cerrada (23)
- [ ] PDF descargable
- [ ] Enviar WhatsApp abre `wa.me`

### 6.6 Agenda

- [ ] Vista **Mes** por defecto
- [ ] Clic en día → modal de eventos del día
- [ ] Evento flujo B: estados correctos
- [ ] Evento demo operaciones: `/agenda?detalle=3e93e6ce-cf03-4f3a-9e57-967572e52737`
- [ ] Detalle: sección **Pedidos operativos** y **Checklist**
- [ ] Confirmar / realizar / cancelar

### 6.7 Operaciones

- [ ] `/operaciones` — pedido SHOW-MIMO en rango de fechas
- [ ] Costo estimado visible
- [ ] **Ver evento** navega a Agenda

### 6.8 Contratos

- [ ] Generar desde evento aceptado
- [ ] PDF imprimible
- [ ] Enviar WhatsApp / marcar enviado / firmado

### 6.9 Configuración

- [ ] Tarifas, turnos, catálogo
- [ ] Pestaña **Proveedores** (1 demo en sandbox)
- [ ] Producto con origen proveedor vinculado

### 6.10 Clientes y Usuarios

- [ ] Clientes: buscar, detalle, historial
- [ ] Usuarios (admin): listar, crear con contraseña generada

---

## 7. Matriz cobertura vs. casos de uso

| Flujo documentado | API smoke | API qa:flujo | UI manual |
|-------------------|-----------|--------------|-----------|
| Landing → solicitud | ✅ | ✅ A1 | §6.1 |
| Solicitud → tomar / editar / cerrar | ✅ | ✅ A2–A4, C | §6.4 |
| Cotización → enviar / aceptar | ✅ | ✅ A5–A6, B3–B5 | §6.5 |
| Agenda → confirmar / realizar | ✅ | ✅ B6, B10 | §6.6 |
| Pedidos + checklist | 🟡 qa:operaciones | ✅ B7–B8 | §6.6–6.7 |
| Link público cliente acepta | ⬜ smoke futuro | ⬜ manual | §6.1 |
| PDF cotización / contrato | ⬜ API | ⬜ | §6.5, 6.8 |
| Meta / postventa | ⬜ fuera MVP | — | — |

---

## 8. Comandos rápidos (referencia)

```bash
npm run db:cleanup          # limpiar demo/QA
npm run qa:flujo            # prueba paso a paso (correos german)
npm run qa:smoke            # smoke rápido con mock @example.test
npm run qa:operaciones      # seed demo operaciones + validación API
npm run db:seed:demo        # recrear evento demo operaciones
```

---

## 9. Datos de prueba recomendados

| Uso | Correo / dato |
|-----|---------------|
| Flujo landing persistente | `germanhuaytalla22@gmail.com` |
| Flujo E2E completo | `germanhuaytalla23@gmail.com` |
| Smoke / cierre descartable | `@example.test` |
| Admin local | `admin@bosquemagico.test` / `BosqueDev123!` |
| Admin sandbox | `admin@bosquemagico.test` / `admin@@@` |

Refresh de credenciales en cualquier entorno:

```bash
npm run db:seed
```

---

## 10. Referencias

| Documento | Ubicación |
|-----------|-----------|
| Informe gerencia | `.docs/entrega-2026-06-15/01-INFORME-GERENCIA.md` |
| Manual operario | `.docs/entrega-2026-06-15/02-MANUAL-OPERARIO.md` |
| **Demo integral gerencia (german22)** | `.docs/entrega-2026-06-15/04-EJEMPLO-REAL-GERMAN22-GERENCIA.md` |
| Bitácora detallada junio | `.docs/PRUEBAS_FLUJO_JUNIO_2026.md` |
| Smoke y checklist base | `.docs/PRUEBAS_CASOS_USO_LOCAL_SANDBOX.md` |

---

*Guía de pruebas — Bosque Mágico. 2026-06-15.*
