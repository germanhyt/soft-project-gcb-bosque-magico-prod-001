# Comandos de desarrollo — Bosque Mágico

Monorepo **React + NestJS + Prisma**. Ejecutar desde la **raíz** del repo salvo que se indique otra ruta.

Principio **gentle-ai**: cada comando deja un resultado verificable (health, migración, tests) antes de avanzar de módulo.

---

## 1. Requisitos

| Herramienta | Uso |
|-------------|-----|
| Node.js 20+ | API, landing, panel |
| Docker Desktop | PostgreSQL local en puerto **5433** (recomendado) |
| npm | Workspaces del monorepo |

---

## 2. Primera vez (setup)

```bash
npm install

# Variables de entorno
cp .env.example apps/api/.env
cp apps/panel/.env.example apps/panel/.env
# Landing: crear apps/landing/.env con VITE_API_URL=/api (o copiar de .env.example si existe)

# Base de datos (Docker)
npm run db:up
npm run prisma:generate -w @bosque/api
npm run prisma:migrate -w @bosque/api
npm run prisma:seed -w @bosque/api
```

`apps/api/.env` mínimo:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/bosque_magico?schema=public"
API_PORT=3000
```

---

## 3. Desarrollo diario (3 terminales)

| Terminal | Comando | URL |
|----------|---------|-----|
| 1 | `npm run db:up` | Postgres :5433 (solo si Docker no está arriba) |
| 2 | `npm run dev:api` | http://localhost:3000/api — Swagger: `/api/docs` |
| 3 | `npm run dev:panel` | http://localhost:5174 (o 5175 si 5174 ocupado) |
| 4 (opcional) | `npm run dev:landing` | http://localhost:5173 |

**Proxy Vite:** panel y landing usan `VITE_API_URL=/api`. Las peticiones van al mismo origen y Vite reenvía a `:3000` (evita CORS).

**Comprobar API:**

```bash
curl http://127.0.0.1:3000/api/health
```

Debe responder `{"status":"ok",...}`. Si `EADDRINUSE` en 3000, cierra el proceso anterior y vuelve a ejecutar `dev:api`.

**Login panel (JWT):** tras `npm run db:seed`, credenciales por defecto en `apps/api/.env`:

```env
ADMIN_EMAIL=admin@bosquemagico.test
ADMIN_PASSWORD=BosqueDev123!
```

```bash
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bosquemagico.test","password":"BosqueDev123!"}'
```

Abre el panel → redirige a `/login`. Para desarrollo sin JWT: `AUTH_DISABLED=true` en `apps/api/.env` (reinicia API).

**Bitácora (gentle-ai)** — tras crear/tomar una solicitud:

```bash
curl "http://127.0.0.1:3000/api/bosque-magico/auditoria?tipoEntidad=solicitud&entidadId=UUID_SOLICITUD"
```

En panel: sección **Bitácora** en detalle de solicitud o cotización.

---

## 4. Scripts raíz (`package.json`)

| Script | Descripción |
|--------|-------------|
| `npm run dev:api` | Nest en watch (`apps/api`) |
| `npm run dev:panel` | Vite panel (:5174) |
| `npm run dev:landing` | Vite landing (:5173) |
| `npm run build` | Build de todos los workspaces |
| `npm run db:up` | `docker compose up -d --wait` |
| `npm run db:down` | Detener contenedor Postgres |
| `npm run db:migrate` | `prisma migrate dev` en API |
| `npm run db:seed` | Seed tarifas + productos |

---

## 5. API (`@bosque/api`)

```bash
npm run build -w @bosque/api
npm run test -w @bosque/api
# Cubre: precios (lunes-viernes, fin de semana, niños extra, >35), aceptar cotización (idempotente, doble reserva), solicitud pública
npm run lint -w @bosque/api

npm run prisma:generate -w @bosque/api
npm run prisma:migrate -w @bosque/api -- --name nombre_migracion
npm run prisma:seed -w @bosque/api
npm run prisma:studio -w @bosque/api   # UI de datos (si está en package.json)
```

---

## 6. Panel y landing

```bash
npm run build -w @bosque/panel
npm run build -w @bosque/landing
# prebuild genera public/robots.txt y sitemap.xml con VITE_SITE_URL
```

Desde `apps/panel` también: `yarn dev` / `npm run dev` (equivalente a `dev:panel`).

---

## 7. Solución de problemas

| Síntoma | Acción |
|---------|--------|
| Panel: “No se pudo cargar el resumen” | `dev:api` sin `EADDRINUSE`; reiniciar panel tras cambiar `.env` |
| `P1000` Prisma | Revisar `DATABASE_URL` y que `db:up` esté healthy |
| Puerto 5174 ocupado | Vite usa 5175; con proxy `/api` no hace falta CORS manual |
| Puerto 3000 ocupado | Windows: `netstat -ano \| findstr :3000` → `taskkill //PID <pid> //F` |
| CORS en navegador | Usar `VITE_API_URL=/api` y proxy en `vite.config.ts` |

---

## 8. Documentación relacionada

- [MODULOS_ESTADO.md](./MODULOS_ESTADO.md) — módulos y fases (gentle-ai)
- [BOSQUE_PLAN_IMPLEMENTACION_REACT_NEST.md](./BOSQUE_PLAN_IMPLEMENTACION_REACT_NEST.md) — plan técnico
- [BOSQUE_LOGICA_NEGOCIO_MODELO_DATOS.md](./BOSQUE_LOGICA_NEGOCIO_MODELO_DATOS.md) — negocio y trazabilidad
