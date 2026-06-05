# Estado de módulos — Bosque Mágico (gentle-ai)

Referencia alineada con **gentle-ai**: asistir sin automatismos opacos, reglas centralizadas, trazabilidad y crecimiento por fases.

Leyenda: ✅ hecho · 🟡 parcial · ⬜ pendiente

---

## Captación y leads (Solicitudes)

| Capacidad | Estado | Notas |
|-----------|--------|-------|
| Landing → solicitud pública | ✅ | Cotizador + `POST /public/.../solicitudes` |
| Panel: listar / filtrar / detalle | ✅ | TanStack Table |
| Tomar / cerrar / seguimiento | ✅ | Con motivo de cierre |
| Editar datos del lead (modal) | ✅ | `SolicitudFormModal` + PATCH ampliado |
| Duplicados suaves | ✅ | `posibleDuplicado` en API |
| **Bitácora visible en panel** | ✅ | `GET /auditoria` + timeline en solicitud y cotización |
| Meta Lead Ads | ⬜ | Fase posterior |

---

## Configuración y reglas

| Capacidad | Estado | Notas |
|-----------|--------|-------|
| Tarifas y límites (panel) | ✅ | PATCH configuración |
| Catálogo productos | ✅ | CRUD + imagen (Dropzone, POST `/productos/:id/imagen`) |
| Cálculo centralizado backend | ✅ | `CalculoPreciosService` |
| Tests reglas de precio | ✅ | `CalculoPreciosService` + use cases aceptar/solicitud pública |
| Tests E2E HTTP | 🟡 | `scripts/qa-smoke-use-cases.mjs` cubre flujo comercial API |

---

## Cotizaciones

| Capacidad | Estado | Notas |
|-----------|--------|-------|
| Crear desde solicitud | ✅ | Panel nueva cotización |
| Ítems + totales explicables | ✅ | base / extra / ítems |
| Enviar WhatsApp / link público | ✅ | Token + landing `/cotizacion/:token` |
| Aceptar (público y panel) | ✅ | Idempotente si ya aceptada |
| Validación doble reserva | ✅ | Slot fecha + turno |
| PDF / imprimir cotización (panel) | ✅ | Vista imprimible → guardar como PDF en navegador |

---

## Eventos (Agenda)

| Capacidad | Estado | Notas |
|-----------|--------|-------|
| Crear desde cotización aceptada | ✅ | Automático al aceptar |
| Agenda por fecha | ✅ | Panel `/agenda` |
| Confirmar / realizar / cancelar | ✅ | Con auditoría en backend |

---

## Trazabilidad (gentle-ai)

| Capacidad | Estado | Notas |
|-----------|--------|-------|
| Registro en `bosque_magico_auditorias` | ✅ | Use cases existentes |
| Consulta desde panel | ✅ | Módulo auditoría Fase 7 |
| Export / reportes | ⬜ | |

---

## Seguridad y endurecimiento (Fase 7)

| Capacidad | Estado | Notas |
|-----------|--------|-------|
| Rate limit solicitud pública | ✅ | Throttler |
| JWT panel | ✅ | Login + guards; `AUTH_DISABLED=true` solo dev |
| Manejo errores uniforme | 🟡 | ValidationPipe global |
| SEO landing final | ✅ | JSON-LD, OG, noindex cotización, sitemap/robots en build |
| UI mockups | ✅ | Panel + landing design system |

---

## Fases futuras (no MVP)

- Contratos, pagos, postventa, proveedores, checklist operativo, integración Meta.

## Mejoras panel (Fase 8)

Ver [MEJORAS_PANEL_FASE8.md](./MEJORAS_PANEL_FASE8.md).

**Estado:** ítems 1–6 completados (tablas, WS, usuario, modales, `/usuarios`, config permisos).

**Siguiente:** E2E panel, export auditoría, o post-MVP (Meta).
