# Pruebas y QA — Bosque Mágico

**Versión:** 1.5  
**Fecha documento:** 2026-06-24  
**Última corrida registrada:** 2026-06-24 (`qa:fases`, `qa:smoke`)  
Entorno: local dev (`http://localhost:3000/api`)  
Usuario QA local: `admin@bosquemagico.test` / `BosqueDev123!`  
Usuario QA sandbox: `admin@bosquemagico.test` / `admin@@@`  
Celular unificado en flujos: `910139973`

## 1) Limpieza aplicada

Comando ejecutado:

```bash
npm run db:cleanup:operativo
```

Resultado (corrida 18-jun — batería completa corregida):

- contratos: 0
- pedidos: 0
- tareas: 0
- eventos: 0
- cotizaciones: 0
- solicitudes: 2 (previas)
- auditorias: 34

Tras batería + `db:cleanup` (solo demo/mock): 3 cotizaciones `COT-00001…003` del flujo QA + 3 solicitudes german/refugio.

Notas:

- Se mantiene catalogo, configuracion, usuarios y proveedores.
- El script tolera entornos locales donde aun no exista `panel_notificaciones`.

## 2) Matriz de casos de uso aplicada

### 2.1 Flujo comercial principal (smoke)

Comando:

```bash
QA_API_URL="http://localhost:3000/api" \
QA_EMAIL="admin@bosquemagico.test" \
QA_PASSWORD="admin@@@" \
npm run qa:smoke
```

Estado: **OK** (20/20).

Cubre:

1. health
2. auth status / login / me
3. configuracion y catalogo publico
4. solicitud publica
5. solicitud manual (panel)
6. listado solicitudes/cotizaciones/eventos/clientes
7. tomar y editar solicitud
8. crear/enviar/aceptar cotizacion
9. confirmar y realizar evento

### 2.2 Flujo detallado paso a paso

Comando:

```bash
QA_API_URL="http://localhost:3000/api" \
QA_EMAIL="admin@bosquemagico.test" \
QA_PASSWORD="admin@@@" \
QA_CELULAR="910139973" \
npm run qa:flujo
```

Estado: **OK** (30/30). Celular unificado: `910139973`.

#### Flujo A (landing)

- correo: `germanhuaytalla22@gmail.com`
- celular: `910139973`
- solicitud: `b3fa65c8-cbaf-4c67-acfc-7de9766aa226`
- cotizacion: `a8dd1292-5b7e-428a-9541-1b9fa9fe169c` (`COT-00001`)
- resultado: cotizacion enviada por WhatsApp

#### Flujo B (manual E2E)

- correo: `germanhuaytalla23@gmail.com`
- celular: `910139973`
- solicitud: `d29121ff-32cc-45b7-9b09-a4cdd8976d97`
- cotizacion: `8da9968e-1cc2-4abe-8eda-2ede59d9a8ce` (`COT-00002`)
- evento: `f0947cbe-1fbd-4e2b-ad6d-6e7c7977654a`
- resultado: evento confirmado y realizado, checklist y pedidos consultables

#### Flujo C (landing + contrato publico)

- correo: `refugiogastronomico8222@gmail.com`
- celular: `910139973`
- solicitud: `82964c89-db51-4e31-ba13-f8435581c4a7`
- cotizacion: `9a5f79f5-efad-420f-8210-a30ba50b240f` (`COT-00003`)
- evento: `bf88accc-de7b-4f78-9922-d91c4ab3ee88`
- contrato token (prefijo): `d1e58046…`
- resultado: contrato publico consultable y flujo operativo completo

#### Cierre de solicitud

- celular: `910139973`
- solicitud: `4596b707-8892-473b-8215-fb5250a5dbe1`
- resultado: cierre por `sin_respuesta`

### 2.3 Casos negativos / variantes

Comando:

```bash
QA_API_URL="http://localhost:3000/api" \
QA_EMAIL="admin@bosquemagico.test" \
QA_PASSWORD="admin@@@" \
QA_CELULAR="910139973" \
npm run qa:negativos
```

Estado: **OK** (5/5).

### 2.5 Casos de Pedidos (`/pedidos`, agenda)

Comando (tras `db:seed:demo`):

```bash
API_URL="http://localhost:3000/api" \
ADMIN_EMAIL="admin@bosquemagico.test" \
ADMIN_PASSWORD="admin@@@" \
npm run qa:pedidos
```

Estado: **OK** (18/18).

Cubre:

| Paso | Endpoint / acción |
|------|-------------------|
| P1–P2 | `GET /pedidos?desde&hasta` + `GET /eventos/:id/pedidos` |
| P3, P5, P17 | `PATCH /pedidos/:id` (etapas confirmado / entregado) |
| P4 | `POST /eventos/:id/pedidos` (alta manual interno) |
| P14–P15 | `POST /eventos/:id/pedidos/generar` + idempotencia |
| P7, P18 | Pedidos visibles en vista operaciones (mes→hoy) |

Parte A usa evento demo (`db:seed:demo`). Parte B crea evento con `fechaEvento` = hoy y turno `turno_1` (evita conflicto con demo en `turno_2`).

### 2.6 Casos de Operaciones (`/operaciones`)

Comandos:

```bash
npm run db:seed:demo
API_URL="http://localhost:3000/api" \
ADMIN_EMAIL="admin@bosquemagico.test" \
ADMIN_PASSWORD="admin@@@" \
npm run qa:operaciones
```

Estado: **OK**.

Filtro aplicado (panel y script QA): **inicio de mes calendario → fecha actual** (zona `America/Lima`).

Resultado:

- proveedores: 2
- pedidos en rango `2026-06-01…2026-06-18`: 1
- evento demo pedidos: `ce8b68fe-ad32-49f2-aeee-645b2a5436f8`
- evento generar pedidos: `38436835-2f7b-4337-848f-3b7f611a9f9a`
- pedidos del evento demo: 1
- tareas checklist: 5

## 3) Casos negativos aplicados

Automatizados en `npm run qa:negativos` (re-ejecutados en corrida 17-jun noche):

- `NEG-01` login invalido -> **401**
- `NEG-02` solicitud publica vacia `{}` -> **400**
- `NEG-03` cerrar solicitud nueva -> **201** (flujo permitido)
- `NEG-04` tomar solicitud cerrada -> **400**
- `NEG-05` contrato publico con token invalido -> **404**

## 4) Problemas detectados y corregidos

### 4.1 Validacion en solicitud publica

Problema:

- `POST /public/bosque-magico/solicitudes` con `{}` devolvia 500 (debia ser 400).

Correccion:

- Se agrego `@IsDefined()` al campo `cliente` en `CrearSolicitudPublicaDto`.

Archivo:

- `apps/api/src/bosque-magico/application/dto/crear-solicitud-publica.dto.ts`

### 4.2 Build panel / render

Problema:

- Error TS por import no usado en `contrato-print.ts`.

Correccion:

- Se retiro import no utilizado.

Archivo:

- `apps/panel/src/lib/contrato-print.ts`

Verificacion:

```bash
npm run build
```

Estado: **OK** (API + landing + panel compilan).

## 5) Cambios de soporte QA agregados

- Script de limpieza operativa:
  - `apps/api/prisma/cleanup-operativo.ts`
- Scripts nuevos:
  - `package.json` -> `db:cleanup:operativo`
  - `apps/api/package.json` -> `prisma:cleanup:operativo`
- Ajuste de flujo para celular unificado:
  - `scripts/qa-flujo-paso-a-paso.mjs` (`QA_CELULAR=910139973` en todos los casos)
- Casos negativos automatizados:
  - `scripts/qa-negativos.mjs` → `npm run qa:negativos`
- **Fases recientes F1–F5:**
  - `scripts/qa-fases-recientes.mjs` → `npm run qa:fases`
- Pedidos operativos (CRUD API):
  - `scripts/qa-pedidos.mjs` → `npm run qa:pedidos`
- Operaciones — filtro mes actual hasta hoy:
  - `apps/panel/src/pages/OperacionesPage.tsx`
  - `scripts/qa-operaciones-demo.mjs`
  - `apps/api/prisma/seed-demo.ts` (evento demo con `fechaEvento` = hoy Lima)

### 5.1 Panel — columnas Cliente / Contacto

Listados alineados con **Clientes**:

- **Solicitudes:** columna «Cliente» (nombre) + «Contacto» (celular + correo).
- **Cotizaciones:** columna «Cliente» (nombre) + «Contacto» (celular + correo).

Archivos:

- `apps/panel/src/pages/SolicitudesPage.tsx`
- `apps/panel/src/pages/CotizacionesPage.tsx`

## 6) Estado final

- Limpieza aplicada: **SI** (última batería 18/06; `qa:fases` 24/06 sin cleanup previo)
- Casos de uso principales: **SI** (smoke 20/20 + flujo 30/30)
- Casos negativos / variantes: **SI** (5/5)
- Casos pedidos (CRUD + generar): **SI** (18/18)
- Casos `/operaciones`: **SI** (filtro mes→hoy)
- **Fases F1–F5:** **SI** (**27/27** — 24/06)
- Correcciones detectadas durante la ejecucion: **SI** (COT NaN, +Pedido, encoding)
- Build final sin errores: **SI**

### Comando batería completa (referencia)

```bash
npm run db:cleanup:operativo
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='BosqueDev123!' QA_CELULAR=910139973 npm run qa:flujo
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='BosqueDev123!' npm run qa:smoke
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='BosqueDev123!' QA_CELULAR=910139973 npm run qa:negativos
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='BosqueDev123!' npm run qa:fases
npm run db:seed:demo
API_URL=http://localhost:3000/api ADMIN_EMAIL=admin@bosquemagico.test ADMIN_PASSWORD='BosqueDev123!' npm run qa:pedidos
API_URL=http://localhost:3000/api ADMIN_EMAIL=admin@bosquemagico.test ADMIN_PASSWORD='BosqueDev123!' npm run qa:operaciones
# npm run db:cleanup   # opcional: quita demo/mock; omitir para revisar todo en panel
```

> **Contraseña:** en local tras `db:seed` usar `BosqueDev123!`. En sandbox VPS usar `admin@@@`.

### 6.1 Codigos de cotizacion — por que varian

| Prefijo | Origen | Ejemplo |
|---------|--------|---------|
| `COT-00001` … | API productiva (`generarCodigo` en repositorio) | Flujos A/B/C, smoke |
| `COT-DEMO-001` | `db:seed:demo` (cotizacion enviada fija) | Solo prueba operaciones |
| `COT-DEMO-OPS-001` | `db:seed:demo` (evento operaciones) | Solo prueba `/operaciones` |

La API **solo secuencia** codigos con formato `COT-NNNNN` (digitos). Los `COT-DEMO-*` no entran en la secuencia; son datos auxiliares del seed.

Si ves mezcla en el panel es porque la bateria dejaba el seed demo **sin limpiar al final**. Tras `npm run db:cleanup` deben quedar solo las del flujo QA (`COT-00001` en adelante), ordenadas de forma coherente.

El codigo largo `COT-DEMO-OPS-1781758473616` era un bug del seed (timestamp); corregido a `COT-DEMO-OPS-001`.

**Nota celular unificado:** con `910139973` en todos los flujos, la identidad de cliente se fusiona por celular; en **Cotizaciones** puede verse el mismo nombre de cliente en varias filas aunque la **Solicitud** tenga el contacto correcto. Buscar por correo en Solicitudes para verificar A/B/C.

---

## 8) QA fases recientes — `qa:fases` (24/06/2026)

Comando:

```bash
QA_API_URL=http://localhost:3000/api \
QA_EMAIL=admin@bosquemagico.test \
QA_PASSWORD='BosqueDev123!' \
npm run qa:fases
```

Estado: **OK (27/27)** — corrida 2026-06-24 en local dev.

### 8.1 Cobertura por fase

| Fase | Casos | Qué valida |
|------|-------|------------|
| **PF** | PF-01…03 | Login, configuración, claves `solicitud.*`, `postventa.*`, `paquetes.*` |
| **F1** | F1-01…04 | Anticipación mínima: rechazo fecha cercana; aceptación fecha válida |
| **F2** | F2-01…09 | Pedido público proveedor; contrato; rechazo confirmar sin contrato enviado; confirmar OK |
| **F3** | F3-01…04 | Subir/eliminar adjuntos contrato (comprobante, contabilidad) |
| **F4** | F4-01…03 | Galería imagen, video URL, catálogo público |
| **F5** | F5-01…03 | Config postventa; realizar evento; auditoría |

### 8.2 Salida resumida (24/06)

```
Resultado: 27 OK / 0 FAIL / 27 total
```

Casos destacados:

- **F2-07:** Confirmar con contrato borrador → **400** (esperado).
- **F2-08:** Confirmar con contrato enviado + pedidos OK → **201**.
- **F3-01/02:** Upload multipart adjuntos → **201**.

---

## 7) Referencias de la entrega

| Documento | Ubicación |
|-----------|-----------|
| Informe gerencia | [01-INFORME-GERENCIA.md](./01-INFORME-GERENCIA.md) |
| Manual operario | [02-MANUAL-OPERARIO.md](./02-MANUAL-OPERARIO.md) |
| Demo german22 | [04-EJEMPLO-REAL-GERMAN22-GERENCIA.md](./04-EJEMPLO-REAL-GERMAN22-GERENCIA.md) |
| Demo flujo C | [05-EJEMPLO-FLUJO-C-CONTRATO-PUBLICO.md](./05-EJEMPLO-FLUJO-C-CONTRATO-PUBLICO.md) |
| Roadmap | [06-ROADMAP-INTEGRACIONES.md](./06-ROADMAP-INTEGRACIONES.md) |
| Entrega anterior | `.docs/entrega-2026-06-17/` |

---

*Guía de pruebas — Bosque Mágico. Versión 1.5 — 2026-06-24.*
