# Pruebas y QA — Bosque Mágico

**Versión:** 1.1  
**Fecha:** 2026-06-16  
**Alcance:** local y sandbox

## 1. Objetivo

Consolidar cómo validar el sistema antes de mostrarlo a gerencia o antes de repetir una demo funcional.

## 2. Scripts disponibles

| Script | Propósito |
|--------|-----------|
| `npm run qa:smoke` | Validación rápida de salud, auth, catálogo y flujo API |
| `npm run qa:flujo` | Flujo paso a paso con correos de prueba `germanhuaytalla22` y `germanhuaytalla23` |
| `npm run qa:operaciones` | Validación de pedidos y operación demo |
| `npm run db:cleanup` | Limpieza de datos demo/QA sin borrar los correos german |

## 3. Entorno sandbox

| Servicio | URL |
|----------|-----|
| API | `https://sandbox-api-bosque.gcbprojects.site/api` |
| Panel | `https://sandbox-panel-bosque.gcbprojects.site` |
| Landing | `https://sandbox-landing-bosque.gcbprojects.site` |

**Credenciales sandbox:** `admin@bosquemagico.test` / `admin@@@`

## 4. Flujo de prueba recomendado

### 4.1 Validación técnica previa

1. Verificar que API, panel y landing respondan.
2. Iniciar sesión en panel.
3. Confirmar que `Dashboard` carga.

### 4.2 Flujo comercial integral

El flujo `qa:flujo` cubre:

- Solicitud pública en landing (`germanhuaytalla22@gmail.com`)
- Gestión comercial y envío de cotización
- Solicitud manual y aceptación completa (`germanhuaytalla23@gmail.com`)
- Confirmación de evento
- Verificación de checklist y pedidos
- Caso adicional de cierre de solicitud

## 5. Comandos listos

### Local

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run db:seed:demo
npm run qa:smoke
npm run qa:flujo
```

### Sandbox

```bash
QA_API_URL="https://sandbox-api-bosque.gcbprojects.site/api" \
QA_EMAIL="admin@bosquemagico.test" \
QA_PASSWORD="admin@@@" \
npm run qa:flujo
```

## 6. Checklist manual para demo

- [ ] Login en panel correcto
- [ ] `Dashboard` muestra próximos eventos con fecha legible
- [ ] La búsqueda por `germanhuaytalla22@gmail.com` devuelve resultados
- [ ] La cotización puede verse y está enviada o aceptada según la demo
- [ ] El evento aparece en `Agenda`
- [ ] `Operaciones` muestra pedidos en el rango
- [ ] El contrato puede abrirse en PDF

## 7. Qué revisar si algo falla

| Síntoma | Revisión sugerida |
|---------|-------------------|
| No carga landing | Verificar API pública y catálogo |
| No entra al panel | Validar credencial sandbox `admin@@@` |
| No se puede aceptar la cotización | Confirmar que esté en estado `Enviada` |
| No aparece pedido en Operaciones | Revisar que el evento esté `Confirmado` |
| Fecha rara en dashboard | Refrescar datos; fix ya aplicado |

## 8. Demo para gerencia

Para mostrar un caso completo ya quedó documentado:

- `.docs/entrega-2026-06-16/04-EJEMPLO-REAL-GERMAN22-GERENCIA.md`

Ese documento es el guion recomendado para demo en vivo.
