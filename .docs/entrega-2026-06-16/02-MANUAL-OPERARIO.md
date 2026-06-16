# Manual del operario — Panel Bosque Mágico

**Para:** Equipo comercial y operación  
**Versión:** 1.3  
**Fecha:** 2026-06-16

## 1. Objetivo

Este manual resume cómo usar el sistema en el trabajo diario, desde que entra un lead hasta que el evento queda ejecutado.

## 2. Acceso

| Entorno | URL |
|---------|-----|
| Panel sandbox | `https://sandbox-panel-bosque.gcbprojects.site` |
| Landing sandbox | `https://sandbox-landing-bosque.gcbprojects.site` |

**Credenciales sandbox:** `admin@bosquemagico.test` / `admin@@@`

## 3. Flujo diario sugerido

```text
1. Solicitudes   -> revisar leads nuevos
2. Cotizaciones  -> enviar propuestas y hacer seguimiento
3. Agenda        -> confirmar lo vendido
4. Operaciones   -> revisar pedidos y costos
5. Contratos     -> generar, enviar y marcar firmado
6. Clientes      -> consultar historial cuando haga falta
```

## 4. Módulos y uso práctico

### 4.1 Dashboard

- Revisa el conteo de solicitudes por estado.
- Valida los `Próximos eventos`.
- Usa el enlace del evento para abrir `Agenda`.

### 4.2 Solicitudes

**Estados:** `Nueva`, `En atención`, `Cotizada`, `Cerrada`

Usos principales:

- Buscar por nombre, celular o correo.
- Tomar la solicitud.
- Registrar notas y seguimiento.
- Editar datos del lead.
- Cerrar cuando no sigue el flujo.
- Ir a la cotización vinculada.

### 4.3 Cotizaciones

**Estados:** `Borrador`, `Enviada`, `Aceptada`, `Cerrada`

Usos principales:

- Revisar o crear la propuesta.
- Confirmar montos calculados por el sistema.
- Enviar por WhatsApp o correo.
- Compartir el link público.
- Descargar PDF.
- Aceptar desde panel si el cliente confirmó por otro canal.

### 4.4 Agenda

**Estados del evento:** `Por confirmar`, `Confirmado`, `Realizado`, `Cancelado`

Usos principales:

- Ver calendario mensual o lista.
- Abrir el detalle del evento.
- Confirmar el evento aceptado.
- Gestionar pedidos y checklist.
- Marcar realizado al finalizar la fiesta.

### 4.5 Operaciones

Usa este módulo para:

- Ver pedidos del rango de fechas.
- Revisar costo estimado total.
- Entrar al evento relacionado desde `Ver evento`.
- Hacer seguimiento operativo semanal.

### 4.6 Contratos

**Estados:** `Borrador`, `Enviado`, `Firmado`, `Anulado`

Usos principales:

- Generar contrato desde el evento.
- Imprimir o guardar PDF.
- Enviar por WhatsApp.
- Marcar enviado o firmado.

## 5. Flujo detallado

### Paso 1 — Entra un lead

Puede venir desde:

- Landing pública.
- Registro manual en `Solicitudes`.

### Paso 2 — Comercial toma el lead

1. Buscar la solicitud.
2. Abrir detalle.
3. Pulsar `Tomar solicitud`.
4. Registrar nota de contacto.

### Paso 3 — Se prepara la cotización

1. Abrir la cotización borrador o crear una nueva.
2. Revisar paquete, fecha, turno, niños e ítems.
3. Guardar.
4. Enviar por WhatsApp o correo.

### Paso 4 — El cliente acepta

1. El cliente abre el link público.
2. Pulsa `Aceptar cotización`.
3. El sistema crea automáticamente el evento.

### Paso 5 — Agenda toma el relevo

1. Abrir el evento en `Agenda`.
2. Confirmarlo.
3. Activar pedidos y checklist.

### Paso 6 — Se gestiona la operación

1. Revisar `Pedidos operativos`.
2. Generar desde cotización o crear manualmente.
3. Marcar avance del checklist.
4. Revisar el módulo `Operaciones`.

### Paso 7 — Se genera el contrato

1. Generar contrato.
2. Revisar datos del cliente y adelanto.
3. Imprimir o enviar PDF.
4. Marcar firmado cuando corresponda.

### Paso 8 — Se cierra el evento

1. Completar checklist.
2. Cerrar pedidos si aplica.
3. Marcar el evento como `Realizado`.

## 6. Reglas importantes

- El cliente solo puede aceptar una cotización si está `Enviada`.
- La aceptación valida que no exista doble reserva del mismo `fecha + turno`.
- Los pedidos operativos se usan cuando el evento ya está `Confirmado`.
- El contrato se genera desde la información vendida y congela un snapshot.

## 7. Buenas prácticas

1. Tomar siempre la solicitud antes de contactar al cliente.
2. Registrar notas de seguimiento en cada contacto.
3. Revisar la cotización antes de enviarla.
4. Confirmar el evento antes de activar pedidos.
5. Revisar `Operaciones` al inicio de cada semana.

## 8. Demo recomendada

Para capacitación o gerencia usar:

- `.docs/entrega-2026-06-16/04-EJEMPLO-REAL-GERMAN22-GERENCIA.md`

Ese documento usa el caso integral de `germanhuaytalla22@gmail.com`.
