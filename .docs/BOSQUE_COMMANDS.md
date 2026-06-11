# Comandos y roadmap panel



## Referencias



| Doc | Contenido |

|-----|-----------|

| [COMANDOS_DESARROLLO.md](./COMANDOS_DESARROLLO.md) | Setup, dev, tests, troubleshooting |

| [MODULOS_ESTADO.md](./MODULOS_ESTADO.md) | Estado MVP por módulo (gentle-ai) |

| [MEJORAS_PANEL_FASE8.md](./MEJORAS_PANEL_FASE8.md) | **Puntos de mejora panel** (tablas, WS, usuario, modales, roles, config) |
| [PRUEBAS_CASOS_USO_LOCAL_SANDBOX.md](./PRUEBAS_CASOS_USO_LOCAL_SANDBOX.md) | Guía de pruebas con mock data (local + sandbox) |
| [entrega-junio-2026/](./entrega-junio-2026/README.md) | **Informe gerencia** + **manual operario** (jun 2026) |



## Puntos de mejora (resumen)



Ver detalle y prioridad en **[MEJORAS_PANEL_FASE8.md](./MEJORAS_PANEL_FASE8.md)**.



1. Tablas con filtro dropdown, mensaje bajo la tabla y paginado — ✅  

2. WebSockets para tablas y notificaciones — ✅  

3. Dropdown usuario (header) — ✅  

4. Modal reutilizable por módulo — ✅  

5. Módulo usuarios / roles / permisos — ✅ (`/usuarios`, solo admin)  

6. Configuración sin textos redundantes + permisos — ✅  



## Aclaraciones UX (implementadas)



### Filtro dropdown en tablas



Encima de la tabla, **tarjeta colapsable “Filtros”** (estilo CRM): buscador, selects y botón refrescar en fila. Componentes: `TableFiltersPanel`, `FilterSearchInput`, `FilterSelect`. Búsqueda en Solicitudes/Cotizaciones (`?q=`). El buscador global del header fue eliminado.

### Breadcrumbs

`PageHeader` con `breadcrumbs={[CRUMB_INICIO, crumb('Módulo')]}` — contador y acción a la derecha (ej. `3 solicitudes` + botón). Aplicado en Dashboard, Solicitudes, Cotizaciones, Agenda, Configuración, Usuarios y detalle de cotización.

### Sidebar y header

- **Sidebar expandido / rail colapsado** (desktop): al contraer queda barra de ~72px solo con iconos (estilo Sisa); botón `chevron` en el borde del sidebar. Persistencia en `localStorage` (`SidebarContext`, `data-sidebar` en `<html>`).
- **Móvil**: menú hamburguesa abre drawer completo; tabs inferiores como acceso rápido.
- **En vivo**: badge `LiveStatusBadge` + campana de notificaciones (`NotificationsDropdown`, WebSocket `bosque:event`).
- Header sin buscador global; búsqueda en filtros de cada módulo.

### Tablas

- `DataTableCard` + `DataTablePagination`: paginado pegado bajo filas (sin espacio vacío), margen superior `mt-3`. Mensaje vacío dentro del tbody.

### Configuración a ancho completo

- Tarifas y turnos en grid de ancho completo (sin `max-w-xl`).
- **Turnos editables** (`turnos.turno_1` … `turno_3`: nombre + `horaInicio` / `horaFin` con `type="time"`, vista previa del rango) — solo admin.
- **`FloatingSaveBar`**: barra blanca al pie con texto “Los cambios se aplican al pulsar guardar.” y botón verde **Guardar cambios** (solo si hay cambios).



### Pruebas con seed de datos



Después del seed base:



```bash

npm run db:seed

npm run db:seed:demo

```



`seed-demo.ts` crea solicitudes de ejemplo (nueva, en atención) y una cotización enviada para probar panel, filtros y notificaciones WS.



### Agenda

- Vista **Lista** (rango de fechas) o **Mes** (calendario mensual con resumen por día; clic en día muestra eventos del día).

**Siguiente:** pruebas manuales por flujo (landing → solicitud → cotización → agenda) con esos datos.


-------------------------------

Observaciones
() Al cotizar de la landing iría a solicitud? o a cotización? dado que ya se seleccionó las opciones, y si llega a solicitud no tendría sentido "crear cotización" qué recomiendas como experto arquictecto (en base a los cambios que se estuvieron haciendo?)
() Módulo de clientes, con opciones a contacto por wa.me y correo, y ver la frecuencia de solicitud, aplica lógica de reconocimiento identidad en landing
() 
()

sandbox-api-bosque
sandbox-panel-bosque
sandbox-landing-bosque

credenciales sandbox:
admin@bosquemagico.test / BosqueDev123!


=================================================================

### Observaciones resueltas (2026-06-04)

**1) Edición en Solicitudes: ¿solicitud o cotización?**

- Hoy en **Solicitudes** el detalle ya permite editar la **solicitud (lead)** en la sección **Seguimiento**: notas y próximo seguimiento (`PATCH /solicitudes/:id`).
- El botón **«Editar cotización (borrador)»** abre el modal de **cotización** a propósito: es la propuesta comercial vinculada, no los datos del lead.
- **Implementado (2026-06-04):** `SolicitudFormModal` para editar datos del lead (nombre, celular, correo, fecha tentativa, turno, niños, notas, próximo seguimiento). API `PATCH /solicitudes/:id` ampliado.

**2) Link público de cotización (cliente)**

- Sí: el link (`/cotizacion/:token` en **landing**) es para el **cliente final**.
- Flujo correcto:
  1. Vendedor deja cotización en **borrador** y la revisa en panel.
  2. **Envía** por WhatsApp o correo → pasa a **Enviada**.
  3. El cliente abre el link y puede **Aceptar cotización**.
  4. Al aceptar → cotización **Aceptada** + se crea **evento** en agenda (por confirmar).
- Si el link muestra que no se puede aceptar:
  - **Borrador:** normal (aún no enviada) — mensaje actualizado en landing.
  - **Aceptada / Cerrada:** ya no admite aceptación en línea.
- Copiar link en **borrador** sirve para previsualizar, pero el cliente no acepta hasta **Enviada**.

**3) PDF de cotización**

- **Implementado (2026-06-04):** botón **Descargar PDF** en detalle de cotización (panel) → vista imprimible con logo Bosque Mágico; el navegador permite guardar como PDF.
- Alternativa adicional: link público en landing + imprimir desde navegador.

**4) Marcar «realizado» (evento)**

- Flujo implementado en **Agenda**:
  - Cotización **Aceptada** → evento **Por confirmar**
  - **Confirmar evento** → **Confirmado**
  - **Marcar realizado** → **Realizado** (`POST /eventos/:id/realizar`)
- También se puede **cancelar** desde por confirmar o confirmado.
- Contratos PDF y estados extra del doc largo (pre-reserva, contrato enviado, etc.) **no** están todos en MVP actual; el núcleo comercial sí está cubierto.


=================================================================

Observaciones 10/06/2026

1)
() 
Analizamos y planificamos:
Realizar el módulo de contratos en base al módulo de solicitudes y cotizaciones, vemos si realizamos un nuevo módulo o lo extendemos,
comparto el modelo de contrato donde se puede resaltar solo los datos inciiales / datos que ya existentes de la cotización y los términos y condiciones,
pdf-contrato

2)
() 
Actualmente en Refugio se hacen campañas de marketing para el área de Bosque Mágico donde la cual se hace eventos de fiestas infantiles, se solicita algunos datos base en el formulario de meta mediante campaña por instagram (Cliente, Celular, Tipo, Pers., Fecha tent.) de esto se exporta la tabla de datos csv que nos provee la misma campaña y de ahí se enviaba de forma manual como broadcast hacia los números;
la idea ahora es automatizar este proceso usando como canal principal el whatssap ( ya he avanzado un panel administrable (registros del leads, módulode  clientes y otros módulos) y tengo una landing donde también se solicita cotización de lo requerido para la fiesta), ahora en base a ello lo ideal talvez es centralizar la comunicación por ese medio y en caso de recibir un mensaje desde las campañas responder de forma automática la información y/o solicitar datos, la idea es tener un diseño de workflow que me permita cubrir este proceso para poder manejar los leads de forma adecuada y profesional

()
Tengo base en el uso de n8n y ycloud par el uso de la api de whattssap, también podría usar webhook para integrarlos con el sistema que he avanzando, 
si bien se puede exponer webhook desde el sistema para recuperar los datos desde meta (me podrías dar unn ejemplo), también por mi lado sería la alternativa de poder recepcionar los mensajes al whattssap que llegaría como el "hola quiero más información" y el agente con n8n responda brindado la información que también utilizando tools apuntando a la base de datos podría realizar verificaciones o validaciones; de ahí podríamos plantear talvez las respuesta que podría realizarce en cada CUS o caso de uso

3)
()
Separar las acciones de envío de información (wstp, correo, link), acciones crud, acciones de envío y confirmación; estos que se denoten un poco separados

()
En "solicitudes" la fecha/hora registro lo colocamos en la primera columna

()
Analizamos de forma correcta la máquina de estados del flujo de Solcitudes y el de Cotización

()
El pdf generado lO geneRAMOS en tamaño normal A4 tanto en cotizaciones como en contratos

()
En configuraciones considerar las fechas de feriado (regla general para determinar las fechas de feriados para nuestro sistema)

()
Pruebas de la config de correos SMTP (test funcional)



4)
