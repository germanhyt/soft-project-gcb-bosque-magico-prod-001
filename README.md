# Bosque Mágico

Monorepo para landing pública, panel CRM y API NestJS.

## Estructura

```text
apps/
  api/      → NestJS + Prisma + PostgreSQL
  landing/  → React + Vite (cliente, SEO)
  panel/    → React + Vite (CRM interno)
.docs/      → Planificación de negocio y arquitectura
```

## Requisitos

- Node.js 20+
- PostgreSQL 15+ **o** Docker Desktop (recomendado para desarrollo)

### Base de datos local

**Opción A — Docker (recomendado)**

1. Inicia **Docker Desktop**.
2. En la raíz del repo:

```bash
npm run db:up
npm run db:migrate -- --name cotizaciones_mvp
npm run db:seed
```

Usa PostgreSQL en `localhost:5433` (usuario/contraseña `postgres` / `postgres`).

**Opción B — PostgreSQL instalado en Windows**

Si ya tienes Postgres en el puerto `5432`, ajusta `apps/api/.env`:

```env
DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/bosque_magico?schema=public"
```

Crea la base si no existe (`CREATE DATABASE bosque_magico;`) y luego:

```bash
npm run prisma:migrate -w @bosque/api -- --name cotizaciones_mvp
npm run prisma:seed -w @bosque/api
```

> Error `P1000 Authentication failed`: la contraseña del `.env` no coincide con tu servidor Postgres.

## Configuración

1. Copiar variables de entorno:

```bash
cp .env.example apps/api/.env
cp apps/landing/.env.example apps/landing/.env
```

2. Ajustar `DATABASE_URL` en `apps/api/.env` y `VITE_API_URL` en `apps/landing/.env` (por defecto `http://localhost:3000/api`).

3. Migrar y sembrar base de datos:

```bash
npm run prisma:generate -w @bosque/api
npm run prisma:migrate -w @bosque/api -- --name init
npm run prisma:seed -w @bosque/api
```

## Desarrollo

Necesitas **tres procesos** en terminales separadas (desde la raíz del monorepo):

```bash
npm run db:up          # PostgreSQL en :5433 (solo la primera vez o si apagaste Docker)
npm run dev:api        # http://localhost:3000/api — Swagger /api/docs

npm run dev:landing    # http://localhost:5173
npm run dev:panel      # http://localhost:5174 (si está ocupado, Vite usa 5175; CORS ya lo incluye)
```

El panel y la landing usan `VITE_API_URL=/api` y un **proxy de Vite** hacia el puerto 3000 (evita errores de CORS en desarrollo).

Si el panel muestra error al cargar datos: (1) confirma que `dev:api` está corriendo sin `EADDRINUSE`, (2) reinicia el panel tras cambiar `.env`, (3) en Windows libera el puerto 3000 si quedó un proceso viejo.

## Panel (Fase 3–4)

### Fase 3

- Dashboard con KPIs por etapa (`GET /bosque-magico/solicitudes/resumen`)
- Tabla de solicitudes (TanStack Table), filtros por etapa
- Crear solicitud manual, tomar, cerrar con motivo, seguimiento (notas + próximo contacto)
- Login JWT (`/login` → `POST /auth/login`). Usuario semilla: ver `ADMIN_EMAIL` / `ADMIN_PASSWORD` en `apps/api/.env`

```bash
cp apps/panel/.env.example apps/panel/.env
npm run dev:panel
```

### Fase 6 — Configuración y catálogo

- `GET/PATCH /bosque-magico/configuracion` — tarifas y límites
- `GET/POST/PATCH /bosque-magico/productos` — catálogo (activar/desactivar)
- Panel `/configuracion` — pestañas Tarifas y Catálogo (imágenes por producto vía Dropzone)

### UI — Mockups (paso a paso)

**Paso 1 (panel):** tokens CRM, layout, dashboard.

**Paso 2 (panel):** Solicitudes, cotizaciones, agenda, configuración + componentes compartidos CRM.

**Paso 3 (landing):** tokens públicos, Plus Jakarta + Nunito Sans, Hero/sections/cotizador/cotización pública con CTAs ámbar y cards táctiles.

### Fase 7 — Endurecimiento (en curso)

- Tests unitarios de `CalculoPreciosService` (`npm run test -w @bosque/api`)
- Rate limit en `POST /public/bosque-magico/solicitudes` (Throttler)
- Bitácora consultable: `GET /bosque-magico/auditoria` + timeline en detalle de solicitud (gentle-ai)
- JWT panel + permisos (`view` / `manage` / `admin`)
- Tests unitarios: precios, aceptar cotización (idempotente + doble reserva), solicitud pública (`npm run test -w @bosque/api`)
- Pendiente: tests E2E HTTP

### Fase 5 — Agenda

- `GET /bosque-magico/eventos/agenda` — vista agrupada por fecha
- Confirmar / realizar / cancelar evento
- Panel: `/agenda` con filtros, colores por etapa y acciones

### Fase 4 — Cotizaciones

Migración (requiere PostgreSQL):

```bash
npm run prisma:migrate -w @bosque/api -- --name cotizaciones_mvp
npm run prisma:seed -w @bosque/api
```

- Tablas: clientes, cumpleañeros, cotizaciones, ítems, productos, eventos, logs de envío
- Calculadora en backend; link público en landing `/cotizacion/:token`
- Panel: cotizaciones, crear desde solicitud, enviar WhatsApp, aceptar

## Landing (Fase 2)

- Secciones: hero, beneficios, paquetes, shows, catering, cotizador, FAQ
- Cotizador con Formik + estimación referencial (tarifas desde API o valores por defecto)
- SEO: metadatos + JSON-LD (LocalBusiness, FAQ), Open Graph, `noindex` en `/cotizacion/:token`, `prebuild` genera `robots.txt` y `sitemap.xml` según `VITE_SITE_URL`

## Endpoints iniciales (Fase 1)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/public/bosque-magico/configuracion` | Tarifas y turnos públicos |
| POST | `/api/public/bosque-magico/solicitudes` | Crear solicitud desde landing |
| GET | `/api/bosque-magico/solicitudes` | Listar solicitudes |
| GET | `/api/bosque-magico/solicitudes/resumen` | KPIs por etapa |
| GET | `/api/bosque-magico/solicitudes/:id` | Detalle |
| POST | `/api/bosque-magico/solicitudes` | Crear manual |
| PATCH | `/api/bosque-magico/solicitudes/:id` | Seguimiento |
| POST | `/api/bosque-magico/solicitudes/:id/tomar` | Tomar (Nueva → En atención) |
| POST | `/api/bosque-magico/solicitudes/:id/cerrar` | Cerrar con motivo |
| GET | `/api/bosque-magico/cotizaciones` | Listar cotizaciones |
| POST | `/api/bosque-magico/cotizaciones` | Crear cotización |
| POST | `/api/bosque-magico/cotizaciones/:id/enviar` | Enviar (WhatsApp/email) |
| GET | `/api/public/bosque-magico/cotizaciones/:token` | Vista pública |
| POST | `/api/public/bosque-magico/cotizaciones/:token/aceptar` | Aceptar desde link |

## Documentación

- `.docs/COMANDOS_DESARROLLO.md` — **comandos** (setup, dev, troubleshooting)
- `.docs/MODULOS_ESTADO.md` — **módulos** y fases (enfoque gentle-ai)
- `.docs/BOSQUE_PLAN_IMPLEMENTACION_REACT_NEST.md` — plan técnico
- `.docs/BOSQUE_LOGICA_NEGOCIO_MODELO_DATOS.md` — negocio, trazabilidad gentle-ai
- `.docs/BOSQUE_LOGICA_NEGOCIO_UX_SIMPLE.md` — estados y UX simplificada
