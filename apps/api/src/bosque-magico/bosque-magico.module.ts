import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ActualizarConfiguracionUseCase } from './application/use-cases/actualizar-configuracion.use-case';
import { ActualizarClienteUseCase } from './application/use-cases/actualizar-cliente.use-case';
import { ActualizarCotizacionUseCase } from './application/use-cases/actualizar-cotizacion.use-case';
import { ActualizarEventoUseCase } from './application/use-cases/actualizar-evento.use-case';
import { ActualizarProductoUseCase } from './application/use-cases/actualizar-producto.use-case';
import { ActualizarSolicitudUseCase } from './application/use-cases/actualizar-solicitud.use-case';
import { AceptarCotizacionUseCase } from './application/use-cases/aceptar-cotizacion.use-case';
import { CancelarEventoUseCase } from './application/use-cases/cancelar-evento.use-case';
import { CerrarSolicitudUseCase } from './application/use-cases/cerrar-solicitud.use-case';
import { ConfirmarEventoUseCase } from './application/use-cases/confirmar-evento.use-case';
import { CrearCotizacionUseCase } from './application/use-cases/crear-cotizacion.use-case';
import { CrearProductoUseCase } from './application/use-cases/crear-producto.use-case';
import { CrearSolicitudManualUseCase } from './application/use-cases/crear-solicitud-manual.use-case';
import { CrearSolicitudPublicaUseCase } from './application/use-cases/crear-solicitud-publica.use-case';
import { GenerarCotizacionBorradorSolicitudUseCase } from './application/use-cases/generar-cotizacion-borrador-solicitud.use-case';
import { EnviarCotizacionUseCase } from './application/use-cases/enviar-cotizacion.use-case';
import { ListarAuditoriaUseCase } from './application/use-cases/listar-auditoria.use-case';
import { ListarConfiguracionPanelUseCase } from './application/use-cases/listar-configuracion-panel.use-case';
import { ListarCotizacionesUseCase } from './application/use-cases/listar-cotizaciones.use-case';
import { ListarEventosUseCase } from './application/use-cases/listar-eventos.use-case';
import { ListarProductosPanelUseCase } from './application/use-cases/listar-productos-panel.use-case';
import { ListarProductosUseCase } from './application/use-cases/listar-productos.use-case';
import { ListarSolicitudesUseCase } from './application/use-cases/listar-solicitudes.use-case';
import { ObtenerAgendaUseCase } from './application/use-cases/obtener-agenda.use-case';
import { ObtenerCatalogoPublicoUseCase } from './application/use-cases/obtener-catalogo-publico.use-case';
import { ObtenerConfiguracionPublicaUseCase } from './application/use-cases/obtener-configuracion-publica.use-case';
import { ObtenerCotizacionUseCase } from './application/use-cases/obtener-cotizacion.use-case';
import { PrevisualizarCotizacionPublicaUseCase } from './application/use-cases/previsualizar-cotizacion-publica.use-case';
import { RealizarEventoUseCase } from './application/use-cases/realizar-evento.use-case';
import { EliminarImagenProductoUseCase } from './application/use-cases/eliminar-imagen-producto.use-case';
import { SubirImagenProductoUseCase } from './application/use-cases/subir-imagen-producto.use-case';
import { TomarSolicitudUseCase } from './application/use-cases/tomar-solicitud.use-case';
import { CalculoPreciosService } from './domain/services/calculo-precios.service';
import { SolicitudCotizacionSyncService } from './domain/services/solicitud-cotizacion-sync.service';
import { IdentidadContactoService } from './domain/services/identidad-contacto.service';
import { AuditoriaRepository } from './infrastructure/repositories/auditoria.repository';
import { ClientesRepository } from './infrastructure/repositories/clientes.repository';
import { ConfiguracionRepository } from './infrastructure/repositories/configuracion.repository';
import { CotizacionesRepository } from './infrastructure/repositories/cotizaciones.repository';
import { CumpleanerosRepository } from './infrastructure/repositories/cumpleaneros.repository';
import { EventosRepository } from './infrastructure/repositories/eventos.repository';
import { ProductosRepository } from './infrastructure/repositories/productos.repository';
import { SolicitudesRepository } from './infrastructure/repositories/solicitudes.repository';
import { AuditoriaController } from './presentation/auditoria.controller';
import { ConfiguracionController } from './presentation/configuracion.controller';
import { CotizacionesController } from './presentation/cotizaciones.controller';
import { EventosController } from './presentation/eventos.controller';
import { ProductosController } from './presentation/productos.controller';
import { PublicBosqueMagicoController } from './presentation/public.controller';
import { SolicitudesController } from './presentation/solicitudes.controller';
import { ClientesController } from './presentation/clientes.controller';
import { ListarClientesUseCase } from './application/use-cases/listar-clientes.use-case';
import { ObtenerClienteUseCase } from './application/use-cases/obtener-cliente.use-case';
import { ResolverIdentidadContactoUseCase } from './application/use-cases/resolver-identidad-contacto.use-case';

@Module({
  imports: [EventsModule],
  controllers: [
    PublicBosqueMagicoController,
    SolicitudesController,
    ClientesController,
    CotizacionesController,
    EventosController,
    ConfiguracionController,
    ProductosController,
    AuditoriaController,
  ],
  providers: [
    SolicitudesRepository,
    ConfiguracionRepository,
    AuditoriaRepository,
    ClientesRepository,
    CumpleanerosRepository,
    CotizacionesRepository,
    ProductosRepository,
    EventosRepository,
    CalculoPreciosService,
    SolicitudCotizacionSyncService,
    IdentidadContactoService,
    ListarClientesUseCase,
    ObtenerClienteUseCase,
    ActualizarClienteUseCase,
    ResolverIdentidadContactoUseCase,
    CrearSolicitudPublicaUseCase,
    GenerarCotizacionBorradorSolicitudUseCase,
    CrearSolicitudManualUseCase,
    ListarSolicitudesUseCase,
    TomarSolicitudUseCase,
    CerrarSolicitudUseCase,
    ActualizarSolicitudUseCase,
    ObtenerConfiguracionPublicaUseCase,
    ObtenerCatalogoPublicoUseCase,
    ListarConfiguracionPanelUseCase,
    ActualizarConfiguracionUseCase,
    CrearCotizacionUseCase,
    ListarCotizacionesUseCase,
    ObtenerCotizacionUseCase,
    ActualizarCotizacionUseCase,
    EnviarCotizacionUseCase,
    AceptarCotizacionUseCase,
    ListarProductosUseCase,
    ListarProductosPanelUseCase,
    CrearProductoUseCase,
    ActualizarProductoUseCase,
    ListarEventosUseCase,
    ObtenerAgendaUseCase,
    ActualizarEventoUseCase,
    ConfirmarEventoUseCase,
    RealizarEventoUseCase,
    CancelarEventoUseCase,
    ListarAuditoriaUseCase,
    SubirImagenProductoUseCase,
    EliminarImagenProductoUseCase,
    PrevisualizarCotizacionPublicaUseCase,
  ],
})
export class BosqueMagicoModule {}
