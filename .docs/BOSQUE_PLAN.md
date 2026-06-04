# CRM Bosque Mágico - Plan de Implementación

## 1. Resumen Ejecutivo

Este documento establece la planificación técnica y funcional para implementar el módulo de gestión de **Bosque Mágico** (fiestas infantiles) dentro del ecosistema actual del Panel Administrativo (Python FastAPI + React).

El sistema constará de 3 componentes principales:
1. **Backend API** (FastAPI) - Lógica de negocio y persistencia
2. **Frontend Admin** (React) - Panel de gestión para administradores/vendedores
3. **Landing Page** (Astro) - Punto de entrada público para clientes (ya implementado)

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            USUARIO FINAL                                   │
│  ┌─────────────────────────┐         ┌─────────────────────────┐          │
│  │   Landing Page (Astro) │────────▶│   API Gateway (FastAPI) │          │
│  │   - Formulario cotización      │   - Endpoint /api/quote  │          │
│  │   - Catálogo interactivo       │   - Validación           │          │
│  │   - Resumen dinámico           │   - Orchestrator         │          │
│  └─────────────────────────┘         └───────────┬─────────────┘          │
│                                                  │                        │
└──────────────────────────────────────────────────┼────────────────────────┘
                                               ┌──▼────────────────────────┐
                                               │    BACKEND (Python)      │
│  ┌─────────────────────────┐                   │  ┌───────────────────┐  │
│  │ Panel Admin (React)    │◀──────────────────│──│ app/api/comercial │  │
│  │ - Dashboard            │                   │  │ (Módulo BM)       │  │
│  │ - Leads                │                   │  └───────────────────┘  │
│  │ - Cotizaciones         │                   │  ┌───────────────────┐  │
│  │ - Eventos              │                   │  │ app/models/       │  │
│  │ - Contratos           │                   │  │ app/services/     │  │
│  │ - Pagos               │                   │  └───────────────────┘  │
│  └─────────────────────────┘                   └────────────────────────┘
```

---

## 3. Módulos del CRM (Basados en Prototipo PHP)

### 3.1 Módulos Prioritarios (Fase 1)

| Módulo | Descripción | Funcionalidades Clave |
|--------|-------------|----------------------|
| **Dashboard** | Vista principal de KPIs | Resumen de reservas, ingresos del mes, eventos próximos |
| **Leads** | Gestión de prospectos | Captura desde landing, origen (FB/IG/Web), estado (Nuevo/Contactado/Perdido/Ganado) |
| **Cotizaciones** | Generación y seguimiento | Crear desde lead, calcular precio automático, enviar por WhatsApp/Email, aceptar/rechazar |
| **Eventos** | Gestión de fiestas | Estado (Por confirmar/Confirmado/Ejecutado/Cancelado),turno, paquete, niños |
| **Clientes** | Base de datos de clientes | Datos de contacto, historial de eventos, preferencias |

### 3.2 Módulos Secundarios (Fase 2)

| Módulo | Descripción | Funcionalidades Clave |
|--------|-------------|----------------------|
| **Contratos** | Generación de contratos | Número de contrato, monto total, adelantar, saldo pendiente, garantía |
| **Pagos** | Seguimiento de pagos | Historial de pagos, estado (Pagado/Pendiente/Vencido), comprobantes |
| **Cumpleañeros** | Registro de niños | Nombre, edad, fecha de cumpleaños, histórico de fiestas |
| **Productos/Servicios** | Catálogo interno | Shows, Extras, Catering con precios |
| **Calendario** | Vista de eventos | Vista por mes/semana de eventos confirmados |
| **Postventa** | Seguimiento post-evento | Encuestas de satisfacción, WhatsApp/Email de seguimiento |



### 3.3 Módulos de Soporte (Fase 3)

- **Vendedores**: Gestión de usuarios vendedores
- **Proveedores**: Contactos de shows, catering, inflables
- **Biblioteca Comercial**: Recursos visuales (brochures, catálogos)
- **Checklist**: Tareas por área antes del evento

---

## 4. Modelo de Datos

### 4.1 Entidades Principales

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Client     │     │      Lead      │     │    Quote        │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)        │     │ id (PK)        │     │ id (PK)         │
│ full_name      │     │ client_name    │     │ quote_code      │
│ phone          │     │ phone          │◀─── │ client_id (FK)  │
│ email          │     │ email          │     │ event_date      │
│ dni            │     │ source         │     │ turno           │
│ ruc            │     │ status         │     │ paquete         │
│ address        │     │ assigned_to    │     │ cantidad_ninos  │
│ created_at     │     │ created_at     │     │ base_price      │
└─────────────────┘     │ converted_at   │     │ extra_kids_cost │
                        └─────────────────┘     │ shows_total     │
                                                │ extras_total    │
┌─────────────────┐     ┌─────────────────┐     │ catering_total  │
│     Event      │     │   Contract      │     │ grand_total     │
├─────────────────┤     ├─────────────────┤     │ status          │
│ id (PK)        │     │ id (PK)         │     │ public_token    │
│ client_id (FK) │     │ event_id (FK)   │     │ sent_channel    │
│ quote_id (FK)   │     │ contract_number│     │ sent_at         │
│ event_date     │     │ total_amount    │     │ created_at      │
│ turno          │     │ advance_amount  │     └─────────────────┘
│ paquete        │     │ pending_amount  │
│ cantidad_ninos │     │ warranty_amount│     ┌─────────────────┐
│ tematica       │     │ receipt_type    │     │     Payment     │
│ status         │     │ tax_document    │     ├─────────────────┤
│ start_time     │     │ conditions_text │     │ id (PK)         │
│ end_time       │     │ status          │     │ event_id (FK)   │
│ notes          │     │ created_at      │     │ amount          │
│ created_at     │     └─────────────────┘     │ payment_date    │
└─────────────────┘                             │ payment_method │
                                                │ receipt_number │
┌─────────────────┐                              │ status          │
│   Contract     │                              └─────────────────┘
│   Item (Shows/ │
│   Extras/      │
│   Catering)    │
├─────────────────┤
│ id (PK)        │
│ quote_id (FK)  │
│ type           │  (show/extra/catering)
│ name           │
│ quantity       │
│ unit_price     │
│ subtotal       │
└─────────────────┘
```


### 4.2 Enums Recomendados

```python
# Paquetes
class Paquete(str, Enum):
    BASICO = "Básico"
    ESTANDAR = "Estándar"
    PREMIUM = "Premium"

# Turnos
class Turno(str, Enum):
    TURNO_1 = "Turno 1 - 9:00 a.m. - 12:00 m."
    TURNO_2 = "Turno 2 - 2:00 p.m. - 5:00 p.m."
    TURNO_3 = "Turno 3 - 7:00 p.m. - 10:00 p.m."

# Estado Lead
class LeadStatus(str, Enum):
    NUEVO = "Nuevo"
    CONTACTADO = "Contactado"
    CONVERTIDO = "Convertido"
    PERDIDO = "Perdido"

# Estado Evento
class EventStatus(str, Enum):
    POR_CONFIRMAR = "Por confirmar"
    CONFIRMADO = "Confirmado"
    EJECUTADO = "Ejecutado"
    CANCELADO = "Cancelado"

# Estado Cotización
class QuoteStatus(str, Enum):
    CREADA = "Creada"
    ENVIADA = "Enviada"
    ACEPTADA = "Aceptada"
    RECHAZADA = "Rechazada"
    VENCIDA = "Vencida"
```

---

## 5. Reglas de Negocio (del Prototipo PHP)

### 5.1 Cálculo de Precios

| Concepto | Fórmula |
|----------|---------|
| **Tarifa base (L-V)** | S/ 380 |
| **Tarifa base (S-D)** | S/ 580 |
| **Niños adicionales** | S/ 25 por niño (26-35 niños) |
| **Adelanto** | S/ 500 (para separar fecha) |
| **Garantía** | S/ 500 |

### 5.2 Validaciones

- **Mínimo niños:** 10
- **Máximo niños:** 35
- **Mínimo catering:** 18 unidades
- **Fechas disponibles:** No permitir doble reserva en mismo turno

---

## 6. API Endpoints Requeridos

### 6.1 Endpoints del Módulo Bosque Mágico

```
POST   /api/bosque-magico/leads              → Crear lead desde landing
GET    /api/bosque-magico/leads              → Listar leads (con filtros)
GET    /api/bosque-magico/leads/{id}         → Ver lead específico
PATCH  /api/bosque-magico/leads/{id}         → Actualizar lead (estado, notes)

POST   /api/bosque-magico/quotes             → Crear cotización
GET    /api/bosque-magico/quotes             → Listar cotizaciones
GET    /api/bosque-magico/quotes/{id}        → Ver cotización
PATCH  /api/bosque-magico/quotes/{id}        → Actualizar cotización
POST   /api/bosque-magico/quotes/{id}/send   → Enviar por WhatsApp/Email
POST   /api/bosque-magico/quotes/{id}/accept → Aceptar cotización (→ crea evento)

POST   /api/bosque-magico/events             → Crear evento
GET    /api/bosque-magico/events             → Listar eventos
GET    /api/bosque-magico/events/{id}        → Ver evento
PATCH  /api/bosque-magico/events/{id}       → Actualizar evento
GET    /api/bosque-magico/events/calendar   → Eventos para calendario

POST   /api/bosque-magico/contracts          → Generar contrato
GET    /api/bosque-magico/contracts          → Listar contratos

POST   /api/bosque-magico/payments           → Registrar pago
GET    /api/bosque-magico/payments           → Listar pagos

GET    /api/bosque-magico/dashboard          → KPIs del dashboard
GET    /api/bosque-magico/catalog/shows      → Catálogo de shows
GET    /api/bosque-magico/catalog/extras     → Catálogo de extras
GET    /api/bosque-magico/catalog/catering   → Catálogo de catering
```

### 6.2 Endpoint de la Landing (ya implementado)

```
POST /api/quote → Recibe payload JSON con:
  {
    "eventDetails": { ... },
    "items": [ ... ],
    "totals": { ... }
  }
```

---

## 7. Integración Landing → CRM

### 7.1 Flujo de Datos

1. **Usuario completa formulario** en Landing Page (Astro)
2. **Frontend** envía `POST /api/quote` con datos completos
3. **API crea Lead + Cotización** automáticamente
4. **Admin recibe notificación** (email/WhatsApp)
5. **Admin convierte Lead → Cliente** en panel

### 7.2 Payload de Cotización (desde Landing)

```json
{
  "source": "landing_page",
  "cliente": {
    "nombre": "Juan Pérez",
    "celular": "999888777",
    "correo": "juan@email.com"
  },
  "evento": {
    "cumpleanero": "Sofía",
    "edad": 8,
    "fecha": "2026-06-15",
    "turno": "Turno 2 - 2:00 p.m. - 5:00 p.m.",
    "ninos": 25,
    "tematica": "Princesas",
    "paquete": "Premium"
  },
  "items": [
    { "tipo": "show", "nombre": "Magic Show", "cantidad": 1, "precio": 250 },
    { "tipo": "catering", "nombre": "Piqueos", "cantidad": 25, "precio": 15 }
  ],
  "totales": {
    "base": 580,
    "extras": 625,
    "total": 1205
  }
}
```

---

## 8. Plan de Implementación por Fases

### Fase 1: Fundamentos (Semanas 1-2)
- [ ] Definir modelos de datos en `app/models/`
- [ ] Crear esquemas de validación en `app/schemas/`
- [ ] Implementar endpoints básicos de Leads y Quotes
- [ ] Conectar endpoint `/api/quote` de Astro con backend

### Fase 2: Gestión de Eventos (Semanas 3-4)
- [ ] Endpoints de Eventos
- [ ] Lógica de cálculo de precios
- [ ] Validación de disponibilidad de fechas
- [ ] Frontend: Vista de lista de eventos

### Fase 3: Contratos y Pagos (Semanas 5-6)
- [ ] Endpoints de Contratos
- [ ] Endpoints de Pagos
- [ ] Frontend: Panel de contratos y pagos
- [ ] Generación de contratos (PDF)

### Fase 4: Funcionalidades Avanzadas (Semanas 7-8)
- [ ] Envío de cotizaciones por WhatsApp/Email
- [ ] Dashboard con KPIs
- [ ] Calendario de eventos
- [ ] Postventa y encuestas

---

## 9. Componentes Frontend (React) a Implementar

```
frontend/src/pages/bosque-magico/
├── DashboardPage.tsx          → KPIs y resumen
├── LeadsPage.tsx              → Lista de leads
├── LeadModal.tsx              → Crear/editar lead
├── QuotesPage.tsx             → Lista de cotizaciones
├── QuoteModal.tsx             → Crear/editar cotización
├── EventsPage.tsx             → Lista de eventos
├── EventModal.tsx             → Detalle del evento
├── ContractsPage.tsx         → Lista de contratos
├── PaymentsPage.tsx          → Lista de pagos
├── CalendarPage.tsx          → Vista de calendario
├── ClientsPage.tsx           → Base de clientes
├── CatalogPage.tsx           → Shows/Extras/Catering
└── components/
    ├── QuoteSendModal.tsx     → Enviar por WhatsApp/Email
    ├── EventStatusBadge.tsx  → Badge de estado
    └── PriceCalculator.tsx  → Calculadora de precios
```

---

## 10. Consideraciones Técnicas

### Autenticación
- Usar el sistema de auth existente del backend (`app/api/auth.py`)
- Roles: `admin`, `vendedor`, `solo_lectura`
- Permisos granulares: `bosque_magico:view`, `bosque_magico:manage`

### Validaciones
- Usar Pydantic schemas para validación de entrada
- Validar disponibilidad de fecha/turno antes de confirmar

### Notificaciones
- Integrar con servicio de WhatsApp (Twilio o Meta API)
- Integrar con servicio de Email (SMTP o servicio cloud)

---

## 11. Notas del Arquitecto

- **Decisión:** Usar el módulo `comercial.py` existente como base, no `sisa_reservas.py` (que es para reservas de mesas)
- **Ventaja:** El frontend ya tiene `ComercialPanel.tsx` que puede extenderse
- **Siguiente paso:** Revisar `app/api/comercial.py` para ver qué endpoints existen y cuáles agregar
- **Dependencias:** Necesitamos agregar las tablas a la base de datos (usar migraciones Alembic)

---

*Documento generado como plan de implementación del módulo CRM para Bosque Mágico.*
*Fecha: Mayo 2026*