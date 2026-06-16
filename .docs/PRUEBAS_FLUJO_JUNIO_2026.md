# Pruebas flujo comercial — Junio 2026

Sesión de QA local: corrección dashboard, limpieza de datos demo y prueba paso a paso con correos de prueba.

## 1) Corrección Dashboard — «INVALID DATE»

**Problema:** En Dashboard → Próximos eventos, la fecha mostraba `INVALID DATE`.

**Causa:** `formatMesDia()` en `apps/panel/src/lib/format.ts` pasaba el ISO completo (`2026-06-24T00:00:00.000Z`) a `formatMesDiaCalendario()`, que espera clave `YYYY-MM-DD`.

**Fix:** Extraer clave con `claveFechaCalendario(iso)` antes de formatear (mismo patrón que `formatFecha()`).

**Extra:** Los eventos del dashboard enlazan a `/agenda?detalle={id}`.

## 2) Limpieza de solicitudes y cotizaciones demo/QA

Script: `apps/api/prisma/cleanup-demo.ts`

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

## 3) Prueba paso a paso — casos de uso

Script: `scripts/qa-flujo-paso-a-paso.mjs`

```bash
npm run db:cleanup    # opcional, antes de correr
npm run qa:flujo
```

Credenciales panel: `admin@bosquemagico.test` / `BosqueDev123!`

### Flujo A — `germanhuaytalla22@gmail.com` (landing → panel)

| Paso | Caso de uso | Endpoint / acción |
|------|-------------|-------------------|
| A1 | Solicitud pública (landing) | `POST /public/bosque-magico/solicitudes` |
| A2 | Listar y localizar por correo | `GET /bosque-magico/solicitudes?busqueda=...` |
| A3 | Tomar solicitud (si etapa nueva) o verificar borrador auto | `POST .../tomar` o skip si `cotizada` |
| A4 | Editar seguimiento | `PATCH .../solicitudes/:id` |
| A5 | Cotización borrador (auto landing o manual) | `POST /bosque-magico/cotizaciones` |
| A6 | Enviar cotización (WhatsApp) | `POST .../cotizaciones/:id/enviar` |

Estado final A: cotización **enviada** (aceptación pendiente — manual o link público).

### Flujo B — `germanhuaytalla23@gmail.com` (manual → E2E)

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

### Caso C — Cerrar solicitud

| Paso | Caso de uso |
|------|-------------|
| C1 | Crear lead descartable |
| C2 | Cerrar con motivo `sin_respuesta` |

## 4) Verificación manual en panel

Tras `npm run qa:flujo`:

1. **Dashboard** — Próximos eventos muestra mes/día correctos (ej. `JUN 24`).
2. **Solicitudes** — Filtrar por `germanhuaytalla22@gmail.com` (en atención/cotizada) y `germanhuaytalla23@gmail.com` (cerrada vía flujo comercial).
3. **Cotizaciones** — Ver borrador/enviada (A) y cerrada/aceptada (B).
4. **Agenda** — Evento del flujo B; clic abre detalle con pedidos/tareas si el show era de proveedor.
5. **Operaciones** — Pedidos de la semana si aplica.

## 5) Comandos rápidos

```bash
npm run db:cleanup          # limpiar demo/QA
npm run qa:flujo            # prueba paso a paso (correos german)
npm run qa:smoke            # smoke rápido con mock @example.test
npm run qa:operaciones      # seed demo operaciones + validación API
npm run db:seed:demo        # recrear evento demo operaciones
```

## 6) Resultado de ejecución (14/06/2026 — local)

### Limpieza (`npm run db:cleanup`)

```
solicitudes: 10, cotizaciones: 8, logsMensaje: 5, clientesHuerfanos: 9
```

### Prueba paso a paso (`npm run qa:flujo`)

**21/21 pasos OK**

| Flujo | Correo | IDs generados |
|-------|--------|---------------|
| A (landing) | germanhuaytalla22@gmail.com | solicitud `927f3063-…`, cotización `28ad87a7-…` (borrador auto) |
| B (E2E) | germanhuaytalla23@gmail.com | solicitud `71658883-…`, cotización `2bfcf451-…`, evento `65d58f8c-…` |
| C (cierre) | lead descartable @example.test | solicitud `ffd8af91-…` |

**Bug corregido durante QA:** `generarCodigo()` en cotizaciones usaba `count()+1` y colisionaba tras limpieza parcial → ahora usa el último código `COT-#####` + 1.

**Dashboard:** `fechaEvento` del resumen (`2026-07-06T00:00:00.000Z`) formatea correctamente con el fix de `formatMesDia`.

## 7) Resultado sandbox (15/06/2026)

**API:** `https://sandbox-api-bosque.gcbprojects.site/api`  
**Login panel:** `admin@bosquemagico.test` / `admin@@@`  
_(El `docker-compose.sandbox.yml` declara `BosqueDev123!` pero el seed en VPS dejó `admin@@@` — usar esa contraseña en sandbox.)_

### `npm run qa:flujo` (sandbox) — 21/21 OK

| Flujo | Correo | IDs sandbox |
|-------|--------|-------------|
| A (landing) | germanhuaytalla22@gmail.com | solicitud `88396d0f-…`, cotización `257f014a-…` (enviada WhatsApp) |
| B (E2E) | germanhuaytalla23@gmail.com | solicitud `bc88b4c0-…`, cotización `53f82cbc-…`, evento `4edb2bdc-…` (realizado, 5 tareas) |
| C (cierre) | lead @example.test | solicitud `0430e045-…` cerrada `sin_respuesta` |

### Operaciones (`qa-operaciones-demo.mjs` + `db:seed:demo` en VPS)

- Proveedor demo: 1
- Pedidos en vista operaciones: 1
- Evento demo: `3e93e6ce-cf03-4f3a-9e57-967572e52737` — 1 pedido + 5 tareas checklist

### Verificación manual en panel sandbox

| Módulo | Qué revisar | URL / acción |
|--------|-------------|--------------|
| Login | Credenciales arriba | https://sandbox-panel-bosque.gcbprojects.site |
| Solicitudes | `germanhuaytalla22@gmail.com` (cotizada/enviada), `23` (cerrada/ganada) | Buscar por correo |
| Cotizaciones | A enviada, B aceptada/cerrada | Listado + detalle |
| Dashboard | Fechas legibles en próximos eventos | Inicio |
| Agenda | Evento demo operaciones | `/agenda?detalle=3e93e6ce-cf03-4f3a-9e57-967572e52737` |
| Operaciones | Pedido SHOW-MIMO en rango | `/operaciones` |
| Configuración | Tab Proveedores (1 demo) | Configuración |
| Landing | Cotizador + envío público | https://sandbox-landing-bosque.gcbprojects.site |

Comando sandbox:

```bash
QA_API_URL="https://sandbox-api-bosque.gcbprojects.site/api" \
QA_EMAIL="admin@bosquemagico.test" \
QA_PASSWORD="admin@@@" \
npm run qa:flujo
```
