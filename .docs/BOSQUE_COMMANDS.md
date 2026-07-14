# Comandos y roadmap panel



## Referencias



| Doc | Contenido |

|-----|-----------|

| [COMANDOS_DESARROLLO.md](./COMANDOS_DESARROLLO.md) | Setup, dev, tests, troubleshooting |

| [MODULOS_ESTADO.md](./MODULOS_ESTADO.md) | Estado MVP por módulo (gentle-ai) |

| [MEJORAS_PANEL_FASE8.md](./MEJORAS_PANEL_FASE8.md) | **Puntos de mejora panel** (tablas, WS, usuario, modales, roles, config) |
| [PRUEBAS_CASOS_USO_LOCAL_SANDBOX.md](./PRUEBAS_CASOS_USO_LOCAL_SANDBOX.md) | Guía de pruebas con mock data (local + sandbox) |
| [entrega-2026-06-24/](./entrega-2026-06-24/README.md) | **Entrega vigente (24 jun 2026):** F1–F5, QA `qa:fases` 27/27, roadmap n8n |
| [entrega-2026-06-17/](./entrega-2026-06-17/README.md) | Entrega previa (17 jun 2026) |
| [entrega-2026-06-15/](./entrega-2026-06-15/README.md) | Entrega previa (15 jun 2026) |
| [entrega-junio-2026/](./entrega-junio-2026/README.md) | Entrega anterior (11 jun 2026) |



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

- Vista **Mes** por defecto (calendario mensual con resumen por día).
- Clic en día → **modal** con lista de eventos (`AgendaDiaModal`); clic en evento → **DetalleModal** (`?detalle=id`).
- Vista **Lista** (rango de fechas) como alternativa (`?vista=lista`).
- Deep link `/agenda?detalle=id` (p. ej. tras aceptar cotización) abre detalle y navega al mes del evento.


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

La idea puede ser si viene de alguna red social aparte que el agente IA reconozca ese canal en caso haya un patron de consulta, por ejemplo que se mencione "Hola me puede dar más información, vengo del instagram", y que el agente reconozca e canal y pueda responder solicitando los datos; qué opinas?


3)

(X)
En "solicitudes" la fecha/hora registro lo colocamos en la primera columna

(x)
Analizamos de forma correcta la máquina de estados del flujo de Solcitudes y el de Cotización

(x)
El pdf generado lo generamos de tamaño normal A4 tanto en cotizaciones como en contratos

(X)
En configuraciones considerar las fechas de feriado (regla general para determinar las fechas de feriados para nuestro sistema)

(x)
Pruebas de la config de correos SMTP (test funcional)

(x)
Distinguir las acciones de envío de información (wstp, correo, link), acciones crud, acciones de envío y confirmación; estos cada módulo

(x)
**Propuesta UX — agrupación de acciones** (implementado en detalle y filas):

| Capa | Dónde | Grupos (orden) |
|------|-------|----------------|
| **Detalle (modal)** | Solicitud, Cotización, Contrato | 1. Compartir con el cliente · 2. Confirmar flujo · 3. Editar / CRUD |
| **Fila (tabla)** | Iconos con `RowActionDivider` | 1. Contacto · 2. Envío documento · 3. Confirmar · 4. Navegar/editar · 5. Cerrar (peligro) |

Reglas: destructivas al final; compartir primero; confirmaciones en bloque `accent`; filas ~6 iconos max — resto en detalle.

(x)
Paginado en catálogo de productos (Configuración → Catálogo, 20/página)

(x)
Módulo usuarios: generar contraseña + mostrar/ocultar; Usuarios al final del sidebar (después de Configuración)




4) 
14/06/2026

(x)
En el módulo de Agenda vemos como primera vista la de por mes, al presionar fecha que se aperture un modal de la lista de eventos y otro en caso de requerir ver el detalle

(x)
Analizamos cómo entraría la lógica de pedidos a proveedores?, esto para cubrir lo necesario en el bosque mágico

**Implementado (2026-06-15):** `Proveedor` + `Pedido` en Prisma; CRUD proveedores en Configuración; pedidos en detalle de evento; auto-generación al confirmar desde ítems de cotización con producto `origen=proveedor`.

(x)
Dashboard «Próximos eventos» mostraba INVALID DATE — fix `formatMesDia` + enlace a detalle agenda. Limpieza demo (`db:cleanup`), prueba paso a paso (`qa:flujo`) con germanhuaytalla22/23@gmail.com. Doc: `.docs/PRUEBAS_FLUJO_JUNIO_2026.md`.



5)
16/06/2026

(X) Problema de renderizado al abrir los modales por ejemplo /agenda?dia=2026-06-22&detalle=e9f2f943-1ae2-4b6f-b052-4e3a9ebadb51
(X) En cada tabla de datos con tanstack/table considerar el paginado de datos, veo que falta en el módulo de operaciones
(X) En catálogo y proveedores consideramos usar filtros de búsqueda, también faltaría su paginado
(X) El módulo de usuarios lo colocamos debajo de Dashboard


Consultas
() Respecto al adelanto referencial de igual forma procede en caso la cotización sale menor a dicho monto?
() al enviar mensaje de confirmación al cliente al elgir con pdf se está incluyendo el link del pdf como tál o lo estás aperturando? no crees que es ilógica aperutrarlo cuando estamos en la opción de envío?
() EL checklist es es con mock data o en qué consiste? es correcto considerarlo?
() El flujo para pediddos a proveedores y contrato está bien pensado? se llega a notificar también a los proveedores?
() 

- Las acciones en proveedores es suficiente?
- considerar el poder adjuntar link del pdf de cotización para el cliente también aparte del aceptar
- el proveedor también puede tener correo de contacto



(X)
- Detectemos problemas de renderización, por ejemplo como usuario percibo que en le siguiente modal lo percibo un poco lento al scrollear dentro de este modal "/agenda?dia=2026-06-30&detalle=17f57a7f-6b96-45f8-8582-faecd7ca2be7", de paso revisemos otros modal

al último
(X) Para gestión de usuario también cosnsideramos filtros y actualizar lista de permisos acorda al sistema 

(x)
procedemos a desplegar 
- commmit / push a git
- los últimos cambios al sandbox en vps paso a paso


(x)
Observaciones
- he detectado que sobre el último test en cotización sale "COT-00NaN"
- En "Pedidos operativos" al presionar "+pedido" me aparece no me saleel modal como tál
- En Pedidos operativos también me aparece este formato "Verificaci�n deploy"
a qué se debe?

----------------------------------------------------------
----------------------------------------------------------
24/06/2026

()
- Para el caso de los paquetes hay un caso específico y es que dentro de los paquetes viene incluido un algún servicio extra / show / catering, te comparto el detalle "
BÁSICO:
Servicio extra (1)
Cajitas Bosque mágico (10)
Alquiler (3 horas)

ESTÁNDAR:
Show (1)
Servicio extra (1)
Cajitas Bosque mágico (10)
Alquiler (3 horas)

PREMIUM:
Show (1)
Servicio extra (1)
Cajitas Bosque mágico (10)
Pop corn o Algodón de azúcar
Piqueos (Importe: S/200 soles)
Asistente de evento
Alquiler (3 horas)", 
ahora cómo sería la propuesta para el rediseño de la lógica?

-----------

- Para solicitar un evento se debe realziar con un aticipación de 7 días o una semana (configurable)

- En la landing para cada producto de catálogo podrá tener un carousel de imágenes que se configurar desde el panel que que pueda ir pasando de img en img en su mismo card, este mismo en caso de haber pueda tener 2 opciones en un lado no invasivo del expandir en un modal lightbox el carousel y el de ver el video en modal también (estos se agregan desde el panel)

- En el flujo considerar que previamente a programarse el evento en el calendar se tiene que generar el contrato.  Además antes de programarse el evento también tiene un flujo con el proveedor donde tiene que confirmar el evento para que luego recién se pueda programar en el calendar, sin estos no se procederá al evento

- Al generar el contrato permitir poder cargar el comprobante de pago y también luego el documento de contabilidad (con drag and dro), y poder gestionar al editar el contrato

- Configurar la postventa para que luego de cerrar el flujo se pueda enviar un formulario por correo de forma automática (opcion de activar / desactivar con toggle switches)

-----------
- la generación de códigos sea atomático por correlativo y prefijo, en los casos donde se hace uso
- en la tabla de cotización consideramos el campo de registro
- en la tabla de catalogo campo imagen poder previaulizar la lista en un modal y el carusel de la landing no está funcionando que pase uno a otro de forma automática, y agregamos el campo de origen

-----------

- La campana de notificaciones al activar le damos color marrón del sistema
- Campo registro en tablas de clientes/operaciones/contratos/usuarios en primera posición
- Podemos permitir aparte de pagindo también cambiar el limite de filas o rows (20, 40, 60, 100, 200) para seleccionar de forma directa desde el backend, esto para todos los módulos que tiene tabla de datos

-----------
- de nueva cuenta vamos a realizar los test completo de todos los casos de uso posibles, detectar error y corregir de ser necesario

------------

- Hay el caso donde el popcorn por ejemplo si bien viene incluido en el paquete premiun, también se ofrece como catering adicional mínimo 18 unidades, para este caso qué propuesta de solución recomiendas


- Te comento un caso específico y es que en el paquete premiun no es que viene incluido el popcorn o algodón del catering sino estos son carritos snacks incluidos, su costo como tal del pack s/.350 por 25 unidades y por cada unidad adicional tiene un costo de s/10  

------------ 

- te comparto los paquetes con los costos reales en la imagen, actualizamos la data
- además a qué se debe que se quitó el tema de interactuar con la cantidad en el carrito, lo consideramos 
--------------
()
- revisamos si se está autogenerando los códigos (serie correlativo) para el casos del catálogo, cotización, contrato? o sigue siendo manual? cómo lo manejaríamos, genera la propuesta (usa ngram)


(X)
- procede con el ajuste
- luego considerando los últimos cambios procedemos con los testing de los diferentes casos de usos posibles

--------------
30/06/2026

()
- considerar que el espacio en cada paquete tiene un costo, y se cosnidciona por día de la semana también, además este es por 3h, si se requiere más de esas horas se tiene un costo adicional? 

(X)
Experto en UI/UX, vamos a refactorizar la landing
- una propuesta de estilos de calidad (paleta acorde al logo de bosque, mayormeente colores sólidos)
- si es necesario usa design sytem, que no se note que sea IA
- usa Referencias de Fiestas infantiles (ya que de ello se basa el proyecot Bosque mágico)
- usamos las imagenes de src/assets/imgs/ para la nuevo propuesta


(x)
- Observando estas decoraciones no están posicionados bien, lo revisamos
- realizamos de nuevo un iteración profesional en la UI, ahora considerando usar las imagesnes "dorador-"  de src/assets/imgs

--------------

()
Panel
- redirección directa a solicitudes
- para cuando se selecciona el paquete premium y se selecciona snack correspondiente, si requiere una cantidad adicional el precio se obtiene del popcorn o algodón del catering cierto? o estás harcodeando?

- respecto a la composición de cada paquete podemos permitir al usuario poder editar a detalle? 


() 
te comparto data actualizada del proyecto, lo revisamos y verificamos si se está cubriendo:
---
# 🍿 CATERING

| Producto | Precio Unitario | Condición |
|---|---|---|
| Popcorn | S/ 10 | Mínimo 18 unidades por evento |
| Algodón de azúcar | S/ 10 | Mínimo 18 unidades por evento |
| Manzanas acarameladas | S/ 10 | Mínimo 18 unidades por evento |
| Mazamorra morada | S/ 6 | Mínimo 18 unidades por evento |
| Gelatina | S/ 5 | Mínimo 18 unidades por evento |
| Arroz con leche | S/ 6 | Mínimo 18 unidades por evento |

---

# 🎪 SERVICIOS EXTRAS

### Grupo A — Shows (costo adicional por niño extra)

| Show disponible | Aplicación | Costo adicional x niño |
|---|---|---|
| Show de Magia | | |
| Show de Burbuja | | |
| Show de Ciencia | Del niño #21 al #35 | S/ 15 |
| Show Competijuegos | | |
| Show Globoflexia | | |
| Show Mimo | | |
| Silent Disco | | |
| Cine al aire libre | | |

### Grupo B — Servicios adicionales

| Servicio | Descripción | Condición | Extra x niño | Lun–Vie | Sáb/Dom/Festivos |
|---|---|---|---|---|---|
| Pintacaritas | Diseños de animales y personajes de fantasía | 1 hr (12–15 niños) | — | S/ 190 | S/ 250 |
| Uñitas (sticker en uñas) | Decoración con stickers de colores y brillos | Máx 20 niñas | S/ 10 | S/ 190 | S/ 250 |
| Hora loca | Carnaval de alegría y color | Máx 20 niños | S/ 10 | S/ 190 | S/ 250 |
| Asistente de fiestas | Apoya reparto de torta, bocaditos, decoración | 3 hrs | — | S/ 150 | S/ 150 |

---

# 🎂 PAQUETES FIESTAS INFANTILES

| Descripción | Básico | Estándar | Premium |
|---|---|---|---|
| Espacio | 3 horas - privado | 3 horas - privado | 3 horas - privado |
| Cajita Bosque Mágico | 10 unidades | 10 unidades | 10 unidades |
| Catering extra | ❌ | ❌ | ✅ (valor S/ 200) |
| Carrito de snack | ❌ | ❌ | ✅ (pop corn o algodón, hasta 25 uni) |
| Show | ❌ | ✅ (a elección) | ✅ (a elección) |
| Servicio extra | ✅ (a elección) | ✅ (a elección) | ✅ (a elección) |
| Asistente de evento | ❌ | ❌ | ✅ (durante el evento) |
| **COSTO Lun–Vie** | **S/ 799** | **S/ 1,310** | **S/ 1,770** |
| **COSTO Sáb/Dom/Feriados** | **S/ 950** | **S/ 1,650** | **S/ 2,100** |

---

### 📋 Reglas generales (inferidas de la información)

- El espacio es **privado** en todos los paquetes por **3 horas**.
- Todos los paquetes incluyen **10 Cajitas Bosque Mágico**.
- Los shows cubren hasta **20 niños**; del niño **#21 al #35** se cobra **S/ 15 adicional por niño**.
- El catering tiene un **mínimo de 18 unidades por evento**.
- Los servicios del Grupo B (Pintacaritas, Uñitas, Hora loca) tienen un costo extra de **S/ 10 por niño adicional** al máximo incluido.
- El **Asistente de fiestas** tiene el mismo precio (S/ 150) tanto entre semana como en fin de semana.



(X)
- mejora de icons de acciones de proveedores y catalogo, mejora de checbox de "mostrar inactivos" como filtro, que haya coherencia entre módulos
- mejora de icons de acciones de usuarios, permisos también (mejora del checbox)
- en config para la regla de "Show — extra por niño (#21–30, S/)" que los rangos también sea configurables y el valor (agrupar para que se entienda), como en adelantos y capacidad base coloquemos descripción breve debajo de título de inputs



(X)
Tenemos el siguiente workflow y el system prompt, el tema es analizar si es conveiente trabajar con la conexión directa hacia base de datos o sino exponemos una api para obtener la solicitudes de los leads, además la idea es detectar de dónde viene el lead (canal que se obtendrá como palabra clave dentro de su consulta p.ej. puede que salude de la sigueinte forma "Hola vengo de intagram"), en base a ello analizamos la mejora de la propuesta


(X)
- redirección directa a solicitudes luego de login
- en operaciones por defecto que sea rango de fechas del mes completo

()
- placeholder en los formualarios o modales donde sea necesario (ejemplo de usuarios)
- sonido de notificación con opción de activar/desactivar el sonido en componente de notificación
- permitir al usuario que pueda editar el detalle de composición de cada paquete o no es necesario? (analicemos esta funcionalidad)


(X) TDD 2026-07-02 — suite preparada
- `npm run test:unit` — Jest API (**sin registros** en BD; mocks) — 75 tests
- `npm run test:integracion` — preview + solicitudes E2E cortas — 53 checks
- `npm run test:casos-uso` — matriz CU-01…CU-11 (reglas negocio) — 41 checks
- `npm run test:flujo-comercial` — **E2E landing → evento realizado** (+ firmas contrato) — 28 pasos
- `npm run test:flujo-manual` — **E2E WhatsApp (n8n) → tomar → realizado** — 20 pasos
- `npm run qa:pedidos` — **operaciones / pedidos proveedor** — 20 pasos (ítem proveedor, vista /operaciones)
- `npm run qa:fases` — fases F1–F5 (anticipación, contrato antes agenda, adjuntos, catálogo, postventa) — 27 checks
- `npm run test:qa-completo` — **suite orquestada** (unit + integración + CU + E2E + qa:pedidos)
- `npm run test:e2e` — demo Premium + borrador — 23 checks
- `npm run test:tdd` — unit + integración + casos-uso (rápido, sin E2E largos)
- Marcas TDD con fecha del día: `TDD-YYYY-MM-DD`, `E2E-FULL-YYYY-MM-DD`, etc.
- Doc histórico: `.docs/TDD-2026-07-01.md`


(X)
accedeiendo a mivps, los registros de solicitudes asociadas con el número 910139973 anteriores lo vamos actualizar con otro dato de qa (con sus asociaciones con los otros módulos), la idea es el último registro de solicitudes d4310d4e-5ae6-44eb-9b31-3d068ccad0d7 para quede como identidad única

(x)
hiciste pruebas con el flujo con operaciones cuando se realiza pedidos a proveedores?, y en qué momento se agenda el evento luego del contrato cierto?



-----------------------------------------------
13/07/26

() Colocamos placeholders en los inputs de los formularios "cotización manual"
() Quitamos el atajo de "revisar cotización" desde solicitudes
() la redirección directa sin ruta debe apuntar al módul de solicitudes
() En agenda ordenamos los labels de colores de los estados en orden (por confirmar, luego confirmado, luego realizado)

() El label que aparece de verde en "Nueva cotización manual" lo ordenamos mejor (mejora UI)
() Respecto a la lógica del crédito usado, sumamos los items hasta llegar al crédito tope, y recién apartir de ahí calcular el excedente (corregir)
() Quitamoss el servicio extra "arco decorativo" inlcuso si está en el seeder
() Para cajita de bosque mágico puede ser clásica o saludable, considerarlo
() Para cuando se notifica al proveedor por algún medio, considera los datos: edad del cumpleañero, cantidad de niños, temática

() Permitir tomar foto de las formas en el contrato (también considerar validar la carga de las formas como requerido)

() Considera el cobro por hora adicionar del espacio alquilado (de lunes a viernes es 150 soles por hora extra, y para sábados/domingos/feriados es 200 por hora extra)



() Hay unas reglas adicionales más aparte de las horas extras, es sobre lo siguiente: 
"EXTRAS PERMITIDOS (REFERENCIA) Servicios no incluidos en la cotización; sujeto a tarifa vigente y disponibilidad. Piñata Torta temática Horario extra (lun a vie S/380 — sáb, dom y fer S/580) Derecho de ingreso de show externo S/300.00 Derecho de ingreso de decoración externo S/100.00 Derecho de ingreso de carrito snack externo S/300.00 Mobiliario extra (Salita lounge para 8 pax por S/50.00 x uni.)", cómo lo manejamos?
(x) Separados en contrato: permitidos (piñata/torta) vs cobrables (hora extra 150/200, ingresos 300/100/300, lounge 50). Tarifas editables en Configuración; selección cobrable en cotización panel.





() Consulta qué pasa si alguien no toma la solicitud (cómo funciona este proceso?)
(x) Auto-tomar en primera acción comercial (crear/enviar cotización, seguimiento, generar borrador). Chip "Sin tomar" + badge de antigüedad (+1h / +24h) en Solicitudes. Dashboard hint "sin tomar · priorizar".
() Analizamos la lógica de la comunicación con los proveedores, si en la cotización se tiene productos sea uno o varios del mismo proveedore se lista estos productos/servicios o la comunicación es uno a uno, analicemos
(x) Comunicación agrupada por proveedor+evento (WhatsApp/correo listan todos los servicios; confirmación pública sigue por ítem). UI en EventoPedidosSection + Operaciones. Botón "Marcar solicitados" por grupo.


() Notificación de recordartorio del evento automático al correo del cliente, al correo del operador del sistema, y notificación al sistema como tal, una semana antes por defecto, que sea confurable el tiempo y su habilitación
(x) Recordatorios automáticos: config `recordatorios.*` (habilitado, dias_antes=7, plantillas, correo operador). Job diario ~08:00 Lima + endpoint admin `POST /jobs/recordatorios-eventos`. Canales: email cliente, email operador (config o ADMIN_EMAIL), notificación panel `evento.recordatorio`. Idempotencia por auditoría.


()
- (x) UI label solicitudes: sin chip superior «Sin tomar»; en tabla badge Nueva + hint discreto `+1h`/`+24h` (solo si aplica).


()
- Desplegamos un versión limpia de tablas transaccionales como el de solicitudes/cotixaciones/operaciones/contratos/agente/clientes, y solo quedarnos con las tablas maestras
Nuevos sub-dominios:
bosquemagico.gcbprojects.site (landing)
admin.bosquemagico.gcbprojects.site (pamel)