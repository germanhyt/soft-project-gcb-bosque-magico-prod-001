# Mejoras panel — Fase 8 (post-MVP)

Referencia: [BOSQUE_COMMANDS.md](./BOSQUE_COMMANDS.md) § puntos de mejora.

Orden gentle-ai: componentes reutilizables primero, luego datos en tiempo real, luego administración.

| # | Mejora | Estado | Notas |
|---|--------|--------|-------|
| 1 | Tabla + mensaje bajo filas + filtro dropdown + paginado | ✅ | `TableFiltersDropdown` (buscador + selects); API `?q=` + paginado |
| 2 | WebSockets tablas y notificaciones | ✅ | `EventsGateway` + `useBosqueSocket` + campana `NotificationsDropdown` |
| 3 | Dropdown usuario (header superior derecha) | 🟡 → ✅ | `UserAccountMenu` |
| 4 | Modal reutilizable por módulo | ✅ | `CerrarSolicitudModal`, `CancelarEventoModal`, `ProductoFormModal` |
| 5 | Módulo usuarios / roles / permisos | ✅ | `/usuarios` CRUD + permisos (solo admin) |
| 6 | Configuración: ayuda no redundante, campos editables según permiso | ✅ | Tarifas `admin`; catálogo `manage`/`admin`; ayuda deduplicada |

## Detalle por ítem

### 1. Tablas de datos

- **Hecho:** TanStack Table en solicitudes; chips de filtro en solicitudes, cotizaciones, agenda.
- **Objetivo:** Filtro tipo **dropdown** encima de la tabla, mensaje claro **debajo** del cuerpo (vacío / error), **paginación** cuando `total > pageSize` (cotizaciones, solicitudes).
- **Componentes:** `TableFiltersDropdown`, `FilterSearchInput`, `FilterSelect`, `TableStatusMessage`, `DataTablePagination`.

### 2. WebSockets

- **Hecho:** Sala `panel-operadores`, evento `bosque:event`, JWT en `handshake.auth.token` (o `AUTH_DISABLED=true` en dev).
- **Emisiones:** solicitud nueva/manual/pública, tomar solicitud, enviar y aceptar cotización.
- **Panel:** `useBosqueSocket` invalida queries TanStack; `NotificationsDropdown` en header.
- **Dev:** proxy Vite `/socket.io` con `ws: true` hacia API :3000.

### 3. Menú usuario

- Clic en icono cuenta → nombre, correo, permisos, cerrar sesión.
- Sidebar mantiene logout en desktop.

### 4. Modales

- Un solo `Modal` (título, cerrar, overlay) para **crear, editar y cerrar** sin depender solo de SweetAlert2.
- Regla de proyecto: cualquier nuevo alta/edición debe usar `Modal` (ver `.cursor/rules/panel-ux.mdc`).
- Hecho: nueva solicitud, cerrar solicitud, productos, usuarios, `CotizacionFormModal` (crear manual, desde solicitud, editar borrador). Rutas `/cotizaciones/nueva` y `/cotizaciones/:id/editar` redirigen a query params en `/cotizaciones`.

### 5. Usuarios y permisos

- **Hoy:** tabla `usuarios`, login JWT, `view` / `manage` / `admin`.
- **Falta:** pantalla `/usuarios`, asignar permisos, desactivar usuario, vendedor vs admin.

### 6. Configuración

- **Hecho:** `configLabel` omite ayuda redundante; pestaña tarifas solo para `admin`.
- Catálogo editable con `manage` o `admin`; vendedor solo lectura.

---

**Fase 8 panel:** ítems 1–6 completados. Siguiente: E2E, export auditoría, o integraciones post-MVP (Meta).
