# Documentación de avance — Bosque Mágico (24 jun 2026)

Carpeta de entrega **vigente** con documentación detallada + **evidencia QA** actualizada (incluye fases F1–F5).

| Documento | Audiencia | Contenido |
|-----------|-----------|-----------|
| [01-INFORME-GERENCIA.md](./01-INFORME-GERENCIA.md) | Gerencia | Informe ejecutivo: alcance, CU-01 a CU-27, arquitectura, QA, riesgos, roadmap |
| [02-MANUAL-OPERARIO.md](./02-MANUAL-OPERARIO.md) | Operación / ventas | Manual por módulo: contrato previo a agenda, proveedor público, adjuntos, postventa |
| [03-PRUEBAS-Y-QA.md](./03-PRUEBAS-Y-QA.md) | QA / técnico | Batería completa + **`qa:fases` 27/27** (corrida 24/06) |
| [04-EJEMPLO-REAL-GERMAN22-GERENCIA.md](./04-EJEMPLO-REAL-GERMAN22-GERENCIA.md) | Gerencia (demo) | Guion integral flujo A — `germanhuaytalla22@gmail.com` |
| [05-EJEMPLO-FLUJO-C-CONTRATO-PUBLICO.md](./05-EJEMPLO-FLUJO-C-CONTRATO-PUBLICO.md) | Gerencia (demo) | Guion flujo C — `refugiogastronomico8222@gmail.com` + contrato público |
| [06-ROADMAP-INTEGRACIONES.md](./06-ROADMAP-INTEGRACIONES.md) | Gerencia / producto | WhatsApp n8n, rediseño paquetes, temas abiertos 24/06 |

**Versión:** 1.5  
**Fecha:** 2026-06-24  
**Última corrida QA registrada:** 2026-06-24 (local, `qa:fases` + `qa:smoke`)

---

## Novedades respecto a entrega 2026-06-17

| Tema | Detalle |
|------|---------|
| **F1 Anticipación** | `solicitud.min_dias_anticipacion` (default 7 días) en landing y panel |
| **F2 Contrato + proveedor antes de agenda** | No se confirma evento sin contrato **Enviado/Firmado** y pedidos de proveedor confirmados |
| **F2 Pedido público proveedor** | Link `/pedido/:token` para confirmar o rechazar desde el proveedor |
| **F3 Adjuntos contrato** | Comprobante de pago y documento contabilidad (drag & drop) |
| **F4 Media catálogo** | Galería de imágenes + URL de video; expuesto en catálogo público |
| **F5 Postventa** | Toggles `postventa.habilitado` + URL formulario; envío al marcar realizado |
| **`packages/shared`** | `contrato-print.ts` compartido entre panel y landing |
| **Notificaciones persistidas** | Estado leído por usuario; campana marrón con pendientes |
| **Tablas** | Columna **Registro** primera; selector de filas 20/40/60/100/200 |
| **Fixes** | COT secuencial atómico; modal +Pedido en detalle agenda; encoding nginx |
| **`qa:fases`** | Script nuevo — **27/27 OK** (24/06) |
| **Sandbox deploy** | Entrypoint API omite re-seed base en cada deploy |

---

## Cómo usar esta carpeta

| Si eres… | Empieza por… |
|----------|--------------|
| Gerencia | `01` → `04` o `05` → `06` (roadmap) |
| Operación | `02` (§6 Agenda y §8 Contratos) |
| QA / antes de deploy | `03` (comandos §6 y §8) |

### Comando batería completa (referencia rápida)

```bash
npm run db:cleanup:operativo
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='BosqueDev123!' QA_CELULAR=910139973 npm run qa:flujo
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='BosqueDev123!' npm run qa:smoke
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='BosqueDev123!' QA_CELULAR=910139973 npm run qa:negativos
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='BosqueDev123!' npm run qa:fases
npm run db:seed:demo
API_URL=http://localhost:3000/api ADMIN_EMAIL=admin@bosquemagico.test ADMIN_PASSWORD='BosqueDev123!' npm run qa:pedidos
API_URL=http://localhost:3000/api ADMIN_EMAIL=admin@bosquemagico.test ADMIN_PASSWORD='BosqueDev123!' npm run qa:operaciones
npm run build
```

> **Credenciales:** local tras `db:seed` → `BosqueDev123!`. Sandbox VPS → `admin@@@` (ver §9 del informe).

---

## Entornos

| Entorno | Panel | Landing |
|---------|-------|---------|
| Sandbox | https://sandbox-panel-bosque.gcbprojects.site | https://sandbox-landing-bosque.gcbprojects.site |
| Local | http://localhost:5174 | http://localhost:5173 |

**Sandbox login:** `admin@bosquemagico.test` / `admin@@@`

---

## Referencias

- `.docs/BOSQUE_COMMANDS.md`
- `.docs/entrega-2026-06-17/` — entrega anterior
- `.docs/doc-n8n/BosqueMagico-Propuesta-AgenteIA-Solicitudes-WhatsApp.md`
- `.docs/PRUEBAS_FLUJO_JUNIO_2026.md`
