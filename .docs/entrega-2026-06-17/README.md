# Documentación de avance — Bosque Mágico (17 jun 2026)

Carpeta de entrega **vigente** con documentación detallada + **evidencia QA** de la batería local (17–18 jun).

| Documento | Audiencia | Contenido |
|-----------|-----------|-----------|
| [01-INFORME-GERENCIA.md](./01-INFORME-GERENCIA.md) | Gerencia | Informe ejecutivo completo: alcance, CU-01 a CU-20, arquitectura, QA, riesgos, temas en seguimiento |
| [02-MANUAL-OPERARIO.md](./02-MANUAL-OPERARIO.md) | Operación / ventas | Manual detallado por módulo, casos prácticos, errores frecuentes |
| [03-PRUEBAS-Y-QA.md](./03-PRUEBAS-Y-QA.md) | QA / técnico | **Evidencia de corrida:** smoke 20/20, flujo 30/30, negativos, pedidos, operaciones, fixes |
| [04-EJEMPLO-REAL-GERMAN22-GERENCIA.md](./04-EJEMPLO-REAL-GERMAN22-GERENCIA.md) | Gerencia (demo) | Guion integral flujo A — `germanhuaytalla22@gmail.com` |
| [05-EJEMPLO-FLUJO-C-CONTRATO-PUBLICO.md](./05-EJEMPLO-FLUJO-C-CONTRATO-PUBLICO.md) | Gerencia (demo) | Guion flujo C — `refugiogastronomico8222@gmail.com` + contrato público |

**Versión:** 1.4  
**Fecha:** 2026-06-17  
**Última corrida QA registrada:** 2026-06-18 (local)

---

## Novedades respecto a entrega 2026-06-16

| Tema | Detalle |
|------|---------|
| **Batería QA ampliada** | `qa:smoke` 20/20, `qa:flujo` **30/30**, `qa:negativos` 5/5, `qa:pedidos` 18/18 |
| **Flujo C** | `refugiogastronomico8222@gmail.com` + contrato público en landing |
| **`db:cleanup:operativo`** | Limpieza operativa sin tocar catálogo/config/usuarios |
| **Celular QA** | `QA_CELULAR=910139973` unificado en scripts |
| **Envío correo cotización** | Modal SMTP/mailto con link PDF en cuerpo (no auto-abre) |
| **Panel UX** | Columnas Cliente/Contacto; Operaciones con búsqueda, paginado, rango mes→hoy |
| **Fix landing** | Solicitud pública vacía → 400 (no 500) |
| **Temas en seguimiento** | `COT-00NaN`, modal +Pedido, encoding en nombres |

---

## Cómo usar esta carpeta

| Si eres… | Empieza por… |
|----------|--------------|
| Gerencia | `01` → `04` (demo german22) o `05` (contrato público) |
| Operación | `02` |
| QA / antes de deploy | `03` (comandos §6) |

### Comando batería completa (referencia rápida)

```bash
npm run db:cleanup:operativo
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='admin@@@' QA_CELULAR=910139973 npm run qa:flujo
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='admin@@@' npm run qa:smoke
QA_API_URL=http://localhost:3000/api QA_EMAIL=admin@bosquemagico.test QA_PASSWORD='admin@@@' QA_CELULAR=910139973 npm run qa:negativos
npm run db:seed:demo
API_URL=http://localhost:3000/api ADMIN_EMAIL=admin@bosquemagico.test ADMIN_PASSWORD='admin@@@' npm run qa:pedidos
API_URL=http://localhost:3000/api ADMIN_EMAIL=admin@bosquemagico.test ADMIN_PASSWORD='admin@@@' npm run qa:operaciones
npm run build
```

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
- `.docs/entrega-2026-06-16/` — entrega anterior
- `.docs/PRUEBAS_FLUJO_JUNIO_2026.md`
