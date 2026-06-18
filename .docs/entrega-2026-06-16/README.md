# Documentación de avance — Bosque Mágico (16 jun 2026)

Carpeta de entrega vigente con cuatro documentos complementarios, **detallados** para gerencia, operación y QA.

| Documento | Audiencia | Contenido |
|-----------|-----------|-----------|
| [01-INFORME-GERENCIA.md](./01-INFORME-GERENCIA.md) | Dirección / gerencia | Objetivos, alcance, casos de uso (CU-01 a CU-18), flujos, arquitectura, contratos, operaciones, estado MVP, entornos, QA, riesgos y roadmap |
| [02-MANUAL-OPERARIO.md](./02-MANUAL-OPERARIO.md) | Equipo comercial y operación | Guía paso a paso del panel y la landing: pantallas, botones, estados, pedidos, checklist, contratos y casos prácticos |
| [03-PRUEBAS-Y-QA.md](./03-PRUEBAS-Y-QA.md) | QA / equipo técnico | Scripts automatizados, limpieza demo, flujos A/B/C, checklist UI, resultados local y sandbox |
| [04-EJEMPLO-REAL-GERMAN22-GERENCIA.md](./04-EJEMPLO-REAL-GERMAN22-GERENCIA.md) | **Gerencia (demo en vivo)** | Caso integral paso a paso con `germanhuaytalla22@gmail.com`: landing → contrato → operaciones → cierre |

**Versión:** 1.3  
**Fecha:** 2026-06-16  
**Estado del producto:** MVP comercial + contratos + módulo operativo (pedidos, proveedores, checklist) — validado en local y sandbox (21/21 pasos QA)

## Cómo usar esta carpeta

| Si eres… | Empieza por… |
|----------|--------------|
| Gerencia | [01-INFORME-GERENCIA.md](./01-INFORME-GERENCIA.md) → luego [04-EJEMPLO-REAL-GERMAN22-GERENCIA.md](./04-EJEMPLO-REAL-GERMAN22-GERENCIA.md) para la demo en vivo |
| Operación / ventas | [02-MANUAL-OPERARIO.md](./02-MANUAL-OPERARIO.md) |
| QA / técnico | [03-PRUEBAS-Y-QA.md](./03-PRUEBAS-Y-QA.md) |

## Novedades respecto a entrega 2026-06-15

| Tema | Detalle |
|------|---------|
| **Documentación consolidada** | Misma profundidad que la entrega del 15/06, con fecha y referencias actualizadas al 16/06 |
| **Demo gerencia** | Guion integral con `germanhuaytalla22@gmail.com` (9 fases + versión corta 15 min) |
| **Informe gerencia** | Casos de uso CU-01 a CU-18, arquitectura, permisos, indicadores de madurez, recomendaciones |
| **Operaciones** | Vista `/operaciones`, pedidos por evento, proveedores en Configuración |
| **QA** | `npm run qa:flujo` (21 pasos), `db:cleanup`, checklist manual completo |

## Entornos sandbox (demo)

| Servicio | URL |
|----------|-----|
| Panel | https://sandbox-panel-bosque.gcbprojects.site |
| Landing | https://sandbox-landing-bosque.gcbprojects.site |
| API | https://sandbox-api-bosque.gcbprojects.site/api |

**Login panel:** `admin@bosquemagico.test` / `admin@@@`

## Referencias complementarias

- `.docs/BOSQUE_FLUJOS_Y_GUIA_USO.md` — flujos operativos (base)
- `.docs/MODULOS_ESTADO.md` — checklist de capacidades por módulo
- `.docs/PRUEBAS_FLUJO_JUNIO_2026.md` — bitácora detallada de sesiones QA
- `.docs/PRUEBAS_CASOS_USO_LOCAL_SANDBOX.md` — smoke y checklist UI
- `.docs/BOSQUE_COMMANDS.md` — comandos, sandbox y observaciones resueltas

Entrega anterior: `.docs/entrega-2026-06-15/`
