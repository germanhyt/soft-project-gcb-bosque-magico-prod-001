# Caso real integral — Germán Huaytalla (`germanhuaytalla22@gmail.com`)

**Para:** Gerencia y equipo comercial  
**Versión:** 1.1  
**Fecha:** 2026-06-16  
**Objetivo:** mostrar el flujo completo del sistema con un caso de prueba realista

## 1. Ficha del caso

| Campo | Valor |
|-------|-------|
| Contacto | Germán Huaytalla |
| Correo | `germanhuaytalla22@gmail.com` |
| Cumpleañera | Sofía |
| Edad | 6 |
| Temática | Princesas |
| Paquete | Premium |
| Turno | `turno_2` |
| Niños | 22 |
| Extras | Pintacaritas, show de magia, popcorn |
| Canal | Landing pública |

## 2. Idea de la demo

La demostración busca que gerencia vea una historia completa:

1. El cliente cotiza en la web.
2. El lead aparece en el panel.
3. Comercial lo toma y envía cotización.
4. El cliente acepta por link público.
5. El evento se crea en agenda.
6. Operación gestiona pedidos y checklist.
7. Se genera contrato.
8. El evento se cierra como realizado.

## 3. Preparación

| Recurso | Dato |
|---------|------|
| Landing | `https://sandbox-landing-bosque.gcbprojects.site` |
| Panel | `https://sandbox-panel-bosque.gcbprojects.site` |
| Login | `admin@bosquemagico.test` / `admin@@@` |

Sugerencia: abrir dos ventanas del navegador, una como cliente (landing) y otra como equipo (panel).

## 4. Paso a paso

### Fase 1 — Cliente en landing

1. Entrar a la landing.
2. Completar el cotizador con el caso de Germán.
3. Enviar la solicitud.

**Resultado esperado:** la solicitud queda creada en backend y debería aparecer en el panel.

### Fase 2 — Comercial en Solicitudes

1. Entrar al panel.
2. Ir a `Solicitudes`.
3. Buscar `germanhuaytalla22@gmail.com`.
4. Abrir detalle.
5. Tomar la solicitud.
6. Registrar una nota de seguimiento.

**Resultado esperado:** la solicitud pasa a `En atención`.

### Fase 3 — Comercial en Cotizaciones

1. Desde la solicitud, abrir la cotización asociada.
2. Revisar paquete, fecha, turno, niños e ítems.
3. Enviar por WhatsApp.
4. Copiar el link público.

**Resultado esperado:** la cotización pasa a `Enviada`.

### Fase 4 — Cliente acepta

1. Abrir el link público de la cotización en una ventana sin login.
2. Pulsar `Aceptar cotización`.

**Resultado esperado:**

- La cotización pasa a `Aceptada`.
- Se crea automáticamente el evento en `Agenda`.

### Fase 5 — Agenda

1. Ir a `Dashboard` o `Agenda`.
2. Localizar el evento de Sofía / Germán.
3. Abrir el detalle.
4. Confirmar el evento.

**Resultado esperado:** el evento pasa a `Confirmado`.

### Fase 6 — Operación del evento

1. En el detalle del evento, revisar `Pedidos operativos`.
2. Generar desde cotización o crear un pedido manual.
3. Ir a `Checklist`.
4. Generar tareas si aún no existen.
5. Marcar algunas tareas como completadas.

**Resultado esperado:** el evento ya muestra actividad operativa.

### Fase 7 — Contrato

1. Desde el detalle del evento, generar contrato.
2. Completar DNI, comprobante y adelanto.
3. Abrir el PDF.
4. Marcar enviado o firmado según la demo.

**Resultado esperado:** el contrato queda asociado al evento.

### Fase 8 — Operaciones

1. Abrir el módulo `Operaciones`.
2. Ajustar el rango de fechas para incluir el evento.
3. Verificar el pedido relacionado.
4. Usar `Ver evento` para volver a `Agenda`.

**Resultado esperado:** gerencia ve el control semanal consolidado.

### Fase 9 — Cierre

1. Volver al detalle del evento.
2. Completar checklist y estado de pedidos si aplica.
3. Marcar el evento como `Realizado`.

**Resultado esperado:** el caso queda cerrado de punta a punta.

## 5. Qué puede remarcarse a gerencia

- No se pierde el lead: entra por landing y llega al panel.
- Comercial y operación trabajan sobre la misma información.
- El cliente puede aceptar sin coordinación manual técnica.
- Agenda, pedidos, checklist y contrato salen del mismo flujo.
- El sistema deja trazabilidad de lo hecho.

## 6. Versión corta de la demo

Si hay poco tiempo, mostrar solo:

1. Landing: envío del cotizador.
2. Panel: búsqueda de la solicitud y cotización enviada.
3. Link público: aceptación.
4. Agenda: confirmación del evento.
5. Operaciones: pedido visible.
6. Contrato PDF.

## 7. Atajo técnico

Si se quiere dejar el caso casi listo antes de la reunión, se puede correr:

```bash
QA_API_URL="https://sandbox-api-bosque.gcbprojects.site/api" \
QA_EMAIL="admin@bosquemagico.test" \
QA_PASSWORD="admin@@@" \
npm run qa:flujo
```

Ese script deja el flujo A con `germanhuaytalla22@gmail.com` preparado para continuar la demo desde la aceptación o desde agenda, según convenga.
