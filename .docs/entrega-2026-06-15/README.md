# Documentación de avance — Bosque Mágico (15 jun 2026)

Carpeta de entrega actualizada con tres documentos complementarios:

| Documento | Audiencia | Contenido |
|-----------|-----------|-----------|
| [01-INFORME-GERENCIA.md](./01-INFORME-GERENCIA.md) | Dirección / gerencia | Objetivos, alcance, casos de uso, flujos, arquitectura, contratos, **operaciones y proveedores**, estado del MVP, entornos, QA y roadmap |
| [02-MANUAL-OPERARIO.md](./02-MANUAL-OPERARIO.md) | Equipo comercial y operación | Guía paso a paso del panel y la landing: pantallas, botones, estados, contratos, **pedidos, checklist y módulo Operaciones** |
| [03-PRUEBAS-Y-QA.md](./03-PRUEBAS-Y-QA.md) | QA / equipo técnico | Scripts automatizados, limpieza demo, flujos A/B/C, verificación manual en panel, resultados local y sandbox |
| [04-EJEMPLO-REAL-GERMAN22-GERENCIA.md](./04-EJEMPLO-REAL-GERMAN22-GERENCIA.md) | **Gerencia (demo en vivo)** | Caso integral paso a paso con `germanhuaytalla22@gmail.com`: landing → contrato → operaciones → cierre |

**Versión:** 1.2  
**Fecha:** 2026-06-15  
**Estado del producto:** MVP comercial + contratos + **módulo operativo (pedidos, proveedores, checklist)** — validado en local y sandbox (21/21 pasos QA)

## Novedades respecto a entrega 2026-06-11

| Tema | Detalle |
|------|---------|
| **Operaciones** | Vista `/operaciones` con pedidos por rango de fechas; enlace a detalle de evento en Agenda |
| **Proveedores** | CRUD en Configuración → pestaña Proveedores; productos con `origen=proveedor` |
| **Pedidos por evento** | Sección en detalle de Agenda; generación automática desde ítems de cotización al confirmar |
| **Checklist** | Tareas por evento (5 plantillas demo); generación manual tras confirmar |
| **Dashboard** | Corrección fechas «INVALID DATE» en Próximos eventos; enlace directo a `/agenda?detalle=` |
| **Agenda UX** | Vista **Mes** por defecto; modal de día → detalle de evento |
| **QA** | `npm run qa:flujo` (21 pasos), `npm run db:cleanup`, `npm run qa:operaciones` |
| **Sandbox** | Flujo completo validado 15/06; credencial admin `admin@@@` (ver doc de pruebas) |

Documentos técnicos de referencia en `.docs/`:

- `BOSQUE_FLUJOS_Y_GUIA_USO.md` — flujos operativos (base)
- `MODULOS_ESTADO.md` — checklist de capacidades por módulo
- `PRUEBAS_FLUJO_JUNIO_2026.md` — bitácora detallada de sesiones QA junio
- `PRUEBAS_CASOS_USO_LOCAL_SANDBOX.md` — smoke y checklist UI
- `BOSQUE_COMMANDS.md` — comandos, sandbox y observaciones resueltas

Entrega anterior: `.docs/entrega-junio-2026/`
