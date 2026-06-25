# Propuesta: Agente IA de WhatsApp para Bosque Mágico

**Fecha:** 2026-06-24  
**Objetivo:** captar datos del cliente por WhatsApp y registrar una `solicitud` en Bosque Mágico, **sin crear cotizacion borrador automatica**.

## 1. Resumen ejecutivo

El prompt actual de Refugio Gastronomico esta orientado a un menu multiproducto:

- informacion general
- reservas en parque
- alquiler para eventos
- eventos programados

Ese enfoque no calza 1:1 con Bosque Magico. En Bosque Magico el caso principal es **capturar leads de fiestas infantiles** y dejar una `solicitud` lista para gestion comercial en el panel.

La propuesta recomendada es:

1. usar un flujo de WhatsApp dedicado para Bosque Magico
2. pedir al cliente solo los datos necesarios para abrir una `solicitud`
3. guardar el lead con `canal = whatsapp`
4. registrar extras de la conversacion en `notas` y `payloadOrigen`
5. **no** disparar la logica que hoy puede generar cotizacion borrador desde landing

## 2. Alineacion con el sistema actual de Bosque Mágico

Hoy el modulo ya soporta `solicitudes` con estos campos principales:

- `nombreContacto`
- `celular`
- `correo`
- `canal`
- `fechaTentativa`
- `turnoInteres`
- `cantidadNinosEstimada`
- `notas`
- `payloadOrigen`
- `etapa`

Ademas:

- Prisma ya contempla `canal = whatsapp`
- el flujo publico actual de landing crea `solicitudes`
- ese flujo **puede** generar una cotizacion borrador automatica cuando detecta ciertos datos de paquete/fecha/ninos

Por eso, para WhatsApp **no conviene reutilizar sin control** el flujo publico actual de landing. Lo correcto es crear un flujo separado para captacion por chat.

## 3. Decision funcional propuesta

### 3.1 Objetivo del agente

El agente debe:

- resolver dudas basicas
- solicitar datos del prospecto
- registrar una `solicitud` en etapa `nueva`
- dejar al equipo comercial un lead util para seguimiento

El agente no debe:

- prometer disponibilidad exacta
- calcular una cotizacion final
- crear cotizacion borrador
- inventar paquetes, precios o reglas no confirmadas

### 3.2 Fuente de verdad

La fuente de verdad debe ser **una sola**: la API de Bosque Magico.

Recomendacion:

- `tool_bosque_solicitud` o equivalente debe guardar en la API / backend
- si n8n necesita espejo en tabla auxiliar, Google Sheets o Airtable, eso debe ocurrir **despues** del guardado exitoso y solo como apoyo operativo

No se recomienda repetir el patron de "guardar en dos tools de negocio" como en el prompt del modulo comercial, porque aumenta riesgo de desalineacion.

## 4. Datos a solicitar al cliente

## 4.1 Minimo tecnico para crear una solicitud

Con el modelo actual, lo minimo para persistir una `solicitud` es:

- `nombreContacto`
- `celular`

## 4.2 Minimo operativo recomendado

Para que el lead sea realmente gestionable por el equipo, se recomienda pedir antes de guardar:

- `nombreContacto`
- `celular`
- `fechaTentativa`
- `turnoInteres`
- `cantidadNinosEstimada`

## 4.3 Datos opcionales de alto valor

Estos datos no deben bloquear el registro, pero ayudan mucho:

- `correo`
- `nombreCumpleanero`
- `edadCumpleanero`
- `tematica`
- `paqueteInteres`
- `observaciones`

## 5. Reglas de validacion

Antes de guardar:

1. `celular` debe tener 9 digitos si el flujo es Peru
2. `fechaTentativa` debe pedirse al usuario en formato `DD/MM/YYYY`
3. antes de invocar la tool, n8n debe transformar la fecha a `YYYY-MM-DD` para alinearse con la API actual
4. `turnoInteres` debe mapearse a uno de estos valores:
   - `turno_1` = `9:00 a.m. - 12:00 m.`
   - `turno_2` = `2:00 p.m. - 5:00 p.m.`
   - `turno_3` = `7:00 p.m. - 10:00 p.m.`
5. `cantidadNinosEstimada` debe ser entero positivo
6. si `cantidadNinosEstimada > 50`, no intentar guardar con el DTO actual; derivar a asesor humano o ampliar backend antes
7. si el usuario no desea completar todo, se puede guardar con minimo tecnico y dejar nota: `Lead incompleto por WhatsApp`

## 6. Mapeo propuesto al backend actual

### 6.1 Registro principal

Guardar la solicitud con:

- `canal = "whatsapp"`
- `detalleOrigen = "n8n_whatsapp_ai"`
- `etapa = "nueva"`

### 6.2 Mapeo de campos

- `nombreContacto` <= nombre del cliente
- `celular` <= celular del cliente
- `correo` <= correo si lo comparte
- `fechaTentativa` <= fecha convertida a `YYYY-MM-DD`
- `turnoInteres` <= turno seleccionado
- `cantidadNinosEstimada` <= numero estimado de ninos

### 6.3 Informacion complementaria

Guardar en `notas` un resumen legible, por ejemplo:

```text
Lead captado por WhatsApp IA.
Cumpleanero: Sofia
Edad: 8
Tematica: Princesas
Paquete de interes: Premium
Observaciones: Desea informacion sobre decoracion y piqueos.
```

Guardar en `payloadOrigen` el detalle estructurado, por ejemplo:

```json
{
  "origen": "whatsapp_n8n",
  "fuente": "agente_ia",
  "conversationProvider": "whatsapp",
  "nombreCumpleanero": "Sofia",
  "edadCumpleanero": 8,
  "tematica": "Princesas",
  "paqueteInteres": "Premium",
  "observacionesCliente": "Desea informacion sobre decoracion y piqueos."
}
```

Esto permite capturar mas contexto **sin tocar el modelo principal** y sin forzar una cotizacion.

## 7. Recomendacion tecnica de implementacion

## 7.1 Opcion recomendada

Crear un flujo especifico para WhatsApp:

- `POST /public/bosque-magico/solicitudes/whatsapp`
- DTO propio, por ejemplo `CrearSolicitudWhatsAppDto`
- use-case propio, por ejemplo `CrearSolicitudWhatsAppUseCase`

Ese use-case debe:

- validar datos
- crear solo la `solicitud`
- usar `canal = whatsapp`
- guardar `payloadOrigen`
- **no** invocar `CrearCotizacionUseCase`

## 7.2 Opcion alternativa

Extender el flujo publico existente con una bandera como:

```json
{
  "origen": "whatsapp",
  "crearBorrador": false
}
```

No es la opcion preferida porque mezcla responsabilidades del cotizador landing con un flujo conversacional distinto y aumenta riesgo de regresiones.

## 8. Flujo conversacional propuesto

## 8.1 Menu inicial sugerido

En Bosque Magico conviene simplificar el menu:

1. Informacion general
2. Registrar solicitud para fiesta infantil
3. Hablar con un asesor

## 8.2 Flujo de captura

Cuando el cliente quiera cotizar o separar informacion para su fiesta:

1. saludar
2. confirmar que se registrara una solicitud
3. pedir datos faltantes de manera secuencial
4. validar
5. guardar
6. confirmar

Orden sugerido:

1. nombre
2. celular
3. fecha tentativa
4. turno
5. cantidad estimada de ninos
6. correo (opcional)
7. nombre del cumpleanero (opcional)
8. edad del cumpleanero (opcional)
9. tematica (opcional)
10. paquete de interes (opcional)
11. observaciones (opcional)

## 8.3 Mensaje de confirmacion

Respuesta sugerida:

`Gracias por escribirnos. Ya registramos tu solicitud y nuestro equipo se contactara contigo para continuar con la atencion.`

## 8.4 Handoff humano

Si el usuario pide hablar con una persona, o si el lead supera las reglas del flujo:

`Entiendo. Compartire tu caso con un asesor para que te ayude de forma directa.`

Opcionalmente agregar link o numero de derivacion si negocio ya lo definio.

## 9. JSON de tool propuesto

Si se crea una tool dedicada en n8n, el payload sugerido es:

```json
{
  "nombreContacto": "Maria Lopez",
  "celular": "999888777",
  "correo": "maria@email.com",
  "fechaTentativa": "2026-07-20",
  "turnoInteres": "turno_2",
  "cantidadNinosEstimada": 25,
  "notas": "Lead captado por WhatsApp IA.\nCumpleanero: Sofia\nEdad: 8\nTematica: Princesas\nPaquete de interes: Premium",
  "payloadOrigen": {
    "origen": "whatsapp_n8n",
    "fuente": "agente_ia",
    "nombreCumpleanero": "Sofia",
    "edadCumpleanero": 8,
    "tematica": "Princesas",
    "paqueteInteres": "Premium",
    "observacionesCliente": "Desea informacion sobre decoracion y piqueos."
  }
}
```

Nota:

- la tool puede aceptar mas campos, pero el backend debe decidir cuales van al modelo principal y cuales quedan en `payloadOrigen`
- no es necesario exigir paquete o tematica para abrir la solicitud

## 10. Borrador de system prompt para Bosque Mágico

```text
### IDENTIDAD Y PROPOSITO
Eres el Asistente Virtual de Bosque Magico.
Tu objetivo principal es captar solicitudes de fiestas infantiles por WhatsApp y registrar correctamente los datos del cliente en el sistema.
Debes ser claro, rapido y amable. No inventes precios, paquetes o disponibilidad que no hayan sido confirmados.
No generes cotizaciones borrador ni cierres ventas; tu funcion es capturar el lead y derivarlo al equipo comercial.

El nombre del cliente es:
{{ $('Webhook').item.json.body.whatsappInboundMessage.customerProfile.name }}
Usalo para personalizar el saludo inicial si esta disponible.

### CONTEXTO TEMPORAL
Hoy es:
{{ $now.toFormat('cccc, d MMMM yyyy') }}

### MENU PRINCIPAL
Al iniciar, saluda y ofrece estas opciones:
1. Informacion general
2. Registrar solicitud para fiesta infantil
3. Hablar con un asesor

### OBJETIVO DEL FLUJO DE SOLICITUD
Si el cliente quiere cotizar, conocer disponibilidad o separar informacion para una fiesta infantil, debes ayudarlo a registrar una solicitud.

### DATOS A RECOLECTAR
Primero busca completar estos datos recomendados:
- nombreContacto
- celular
- fechaTentativa
- turnoInteres
- cantidadNinosEstimada

Luego, si el cliente desea compartir mas detalle, puedes recoger:
- correo
- nombreCumpleanero
- edadCumpleanero
- tematica
- paqueteInteres
- observaciones

### VALIDACIONES
Antes de guardar, verifica que:
1. el celular tenga 9 digitos
2. la fecha venga del usuario en formato DD/MM/YYYY
3. el turno sea una de estas opciones:
   - Turno 1: 9:00 a.m. - 12:00 m.
   - Turno 2: 2:00 p.m. - 5:00 p.m.
   - Turno 3: 7:00 p.m. - 10:00 p.m.
4. la cantidad de ninos sea un numero entero positivo
5. si la cantidad supera 50, no guardes automaticamente y deriva el caso a un asesor

### INSTRUCCION CRITICA DE HERRAMIENTA
Cuando tengas como minimo:
- nombreContacto
- celular

y preferiblemente tambien:
- fechaTentativa
- turnoInteres
- cantidadNinosEstimada

invoca la tool `tool_bosque_solicitud` con un JSON valido y exacto para registrar la solicitud.

La fecha debe enviarse transformada a YYYY-MM-DD.
El turno debe enviarse mapeado a `turno_1`, `turno_2` o `turno_3`.

### REGLA DE NEGOCIO IMPORTANTE
Esta automatizacion solo debe crear una solicitud.
No debes crear cotizacion borrador ni llamar herramientas que generen cotizaciones automaticas.

### RESPUESTA DESPUES DE GUARDAR
Despues de guardar, responde:
"Gracias por escribirnos. Ya registramos tu solicitud y nuestro equipo se contactara contigo para continuar con la atencion."

### HANDOFF HUMANO
Si el usuario pide hablar con humano, su caso es confuso o supera las reglas del flujo, responde:
"Entiendo. Compartire tu caso con un asesor para que te ayude de forma directa."
```

## 11. Siguiente paso recomendado

Antes de implementar, cerrar estas decisiones:

1. si el menu tendra solo Bosque Magico o tambien informacion de otros modulos
2. si el guardado ira directo al backend de Bosque o primero a una tool intermedia en n8n
3. si `fechaTentativa`, `turnoInteres` y `cantidadNinosEstimada` seran obligatorios para guardar o solo recomendados
4. si para casos mayores a 50 ninos se derivara a humano o se ampliara el DTO actual

## 12. Conclusion

La forma mas limpia de adaptarlo a Bosque Magico es separar el flujo de WhatsApp del flujo actual de landing/cotizador. Asi el agente captura el lead, llena una `solicitud` real del sistema y evita crear borradores o side effects que hoy pertenecen a otro caso de uso.
