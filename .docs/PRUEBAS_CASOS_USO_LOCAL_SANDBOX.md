# Pruebas de casos de uso (local y sandbox)

Este documento define una base de pruebas con mock data para validar flujos clave de Bosque Magico.

## 1) Preparacion de entorno

### Local

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run db:seed:demo
```

Levantar apps:

```bash
npm run dev:api
npm run dev:panel
npm run dev:landing
```

### Sandbox VPS

- Asegurar rama `sandbox` desplegada en `/home/projects/proyecto-bosque-magico`.
- Verificar contenedores:

```bash
docker compose -f docker-compose.sandbox.yml ps
```

Si la landing no deja elegir shows o el cotizador muestra **Network Error**, revisar que la API no solo responda `/health` sino también catálogo y login. Reparación en VPS:

```bash
bash scripts/sandbox-repair.sh
```

## 2) Smoke test automatico (API + casos clave)

Script disponible en `scripts/qa-smoke-use-cases.mjs`.

### Ejecutar en local

```bash
npm run qa:smoke
```

### Ejecutar contra sandbox

PowerShell:

```powershell
$env:QA_API_URL="https://sandbox-api-bosque.gcbprojects.site/api"
$env:QA_EMAIL="admin@bosquemagico.test"
$env:QA_PASSWORD="BosqueDev123!"
npm run qa:smoke
```

Git Bash:

```bash
QA_API_URL="https://sandbox-api-bosque.gcbprojects.site/api" \
QA_EMAIL="admin@bosquemagico.test" \
QA_PASSWORD="BosqueDev123!" \
npm run qa:smoke
```

## 3) Cobertura de casos de uso (smoke)

El smoke valida:

1. Salud del backend (`/health`)
2. Estado de auth (`/auth/status`)
3. Login (`/auth/login`)
4. Perfil autenticado (`/auth/me`)
5. Configuracion publica (`/public/bosque-magico/configuracion`)
6. Catalogo publico (`/public/bosque-magico/catalogo`)
7. Crear solicitud publica con mock data
8. Crear solicitud manual con mock data (autenticado)
9. Listar solicitudes, cotizaciones, eventos, clientes
10. Ver configuracion privada de panel
11. **Flujo E2E comercial (API):** tomar solicitud → editar solicitud → crear cotización → enviar → aceptar → confirmar evento → marcar realizado

### Cobertura vs casos de uso documentados

| Flujo (`BOSQUE_FLUJOS_Y_GUIA_USO.md`) | API smoke | UI manual |
|--------------------------------------|-----------|-----------|
| Landing → solicitud | ✅ crear pública | Checklist §4 |
| Solicitud → tomar / editar / cerrar | ✅ tomar + PATCH; cerrar manual | Checklist §4 |
| Cotización → enviar / aceptar | ✅ E2E | Checklist §4 |
| Agenda → confirmar / realizar | ✅ E2E | Checklist §4 |
| Link público cliente acepta | ⬜ (smoke futuro) | Manual landing |
| PDF cotización panel | ⬜ (UI) | Botón Descargar PDF |
| Contratos / Meta / postventa | ⬜ fuera MVP | — |

## 4) Checklist manual UI (panel + landing)

### Landing

- Cotizador carga catalogo y configuracion.
- Envio de solicitud publica exitoso.
- Verificar mensaje de confirmacion y no errores en consola.

### Panel

- Login exitoso con credenciales sandbox/local.
- Dashboard carga sin errores.
- Solicitudes: listar, filtrar, ver detalle, crear manual.
- Cotizaciones: listar, ver detalle, crear o editar borrador.
- Agenda: vista lista y vista mes.
- Clientes: listar, detalle y acciones de contacto.
- Configuracion: guardar cambios y persistencia.
- Usuarios (admin): listar y crear usuario.

## 5) Datos de prueba recomendados

- Usuario admin base:
  - `admin@bosquemagico.test` / `BosqueDev123!`
- Usuario admin sandbox alterno:
  - `admin.sandbox@gcbprojects.site` / `BosqueSandbox!2026`

Nota: para refresh de credenciales en cualquier entorno:

```bash
npm run db:seed
```

