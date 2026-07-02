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
import { GenerarPedidosEventoUseCase } from './application/use-cases/generar-pedidos-evento.use-case';
import { CrearCotizacionUseCase } from './application/use-cases/crear-cotizacion.use-case';
import { CrearProductoUseCase } from './application/use-cases/crear-producto.use-case';
import { CrearProveedorUseCase } from './application/use-cases/crear-proveedor.use-case';
import { ActualizarProveedorUseCase } from './application/use-cases/actualizar-proveedor.use-case';
import { ListarProveedoresUseCase } from './application/use-cases/listar-proveedores.use-case';
import { CrearPedidoUseCase } from './application/use-cases/crear-pedido.use-case';
import { ActualizarPedidoUseCase } from './application/use-cases/actualizar-pedido.use-case';
import { GenerarTareasEventoUseCase } from './application/use-cases/generar-tareas-evento.use-case';
import { ListarTareasEventoUseCase } from './application/use-cases/listar-tareas-evento.use-case';
import { CrearTareaEventoUseCase } from './application/use-cases/crear-tarea-evento.use-case';
import { ActualizarTareaEventoUseCase } from './application/use-cases/actualizar-tarea-evento.use-case';
import { ListarPedidosEventoUseCase } from './application/use-cases/listar-pedidos-evento.use-case';
import { ListarPedidosOperacionesUseCase } from './application/use-cases/listar-pedidos-operaciones.use-case';
import { CrearSolicitudManualUseCase } from './application/use-cases/crear-solicitud-manual.use-case';
import { CrearSolicitudPublicaUseCase } from './application/use-cases/crear-solicitud-publica.use-case';
import { GenerarCotizacionBorradorSolicitudUseCase } from './application/use-cases/generar-cotizacion-borrador-solicitud.use-case';
import { EnviarPedidoProveedorCorreoUseCase } from './application/use-cases/enviar-pedido-proveedor-correo.use-case';
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
import { ObtenerContratoPublicoUseCase } from './application/use-cases/obtener-contrato-publico.use-case';
import { ObtenerPedidoPublicoUseCase } from './application/use-cases/obtener-pedido-publico.use-case';
import { ResponderPedidoPublicoUseCase } from './application/use-cases/responder-pedido-publico.use-case';
import { ObtenerCotizacionUseCase } from './application/use-cases/obtener-cotizacion.use-case';
import { PrevisualizarCotizacionPublicaUseCase } from './application/use-cases/previsualizar-cotizacion-publica.use-case';
import { RealizarEventoUseCase } from './application/use-cases/realizar-evento.use-case';
import { EliminarImagenProductoUseCase } from './application/use-cases/eliminar-imagen-producto.use-case';
import { GestionarMediaProductoUseCase } from './application/use-cases/gestionar-media-producto.use-case';
import { SubirImagenProductoUseCase } from './application/use-cases/subir-imagen-producto.use-case';
import { TomarSolicitudUseCase } from './application/use-cases/tomar-solicitud.use-case';
import { ComposicionPaqueteRepository } from './infrastructure/repositories/composicion-paquete.repository';
import { CalculoPreciosService } from './domain/services/calculo-precios.service';
import { ComposicionPaqueteService } from './domain/services/composicion-paquete.service';
import { SolicitudCotizacionSyncService } from './domain/services/solicitud-cotizacion-sync.service';
import { SmtpService } from './domain/services/smtp.service';
import { AnticipacionEventoService } from './domain/services/anticipacion-evento.service';
import { PrecondicionesEventoService } from './domain/services/precondiciones-evento.service';
import { IdentidadContactoService } from './domain/services/identidad-contacto.service';
import { AuditoriaRepository } from './infrastructure/repositories/auditoria.repository';
import { ClientesRepository } from './infrastructure/repositories/clientes.repository';
import { ContratosRepository } from './infrastructure/repositories/contratos.repository';
import { ContratoAdjuntosRepository } from './infrastructure/repositories/contrato-adjuntos.repository';
import { ConfiguracionRepository } from './infrastructure/repositories/configuracion.repository';
import { CotizacionesRepository } from './infrastructure/repositories/cotizaciones.repository';
import { CumpleanerosRepository } from './infrastructure/repositories/cumpleaneros.repository';
import { EventosRepository } from './infrastructure/repositories/eventos.repository';
import { ProductoMediaRepository } from './infrastructure/repositories/producto-media.repository';
import { ProductosRepository } from './infrastructure/repositories/productos.repository';
import { ProductoMediaSyncService } from './domain/services/producto-media-sync.service';
import { PostventaService } from './domain/services/postventa.service';
import { NotificacionProveedorService } from './domain/services/notificacion-proveedor.service';
import { PedidosRepository } from './infrastructure/repositories/pedidos.repository';
import { ProveedoresRepository } from './infrastructure/repositories/proveedores.repository';
import { TareasEventoRepository } from './infrastructure/repositories/tareas-evento.repository';
import { SecuenciasRepository } from './infrastructure/repositories/secuencias.repository';
import { SolicitudesRepository } from './infrastructure/repositories/solicitudes.repository';
import { AuditoriaController } from './presentation/auditoria.controller';
import { ConfiguracionController } from './presentation/configuracion.controller';
import { CotizacionesController } from './presentation/cotizaciones.controller';
import { EventosController } from './presentation/eventos.controller';
import { ProductosController } from './presentation/productos.controller';
import { PedidosController } from './presentation/pedidos.controller';
import { ProveedoresController } from './presentation/proveedores.controller';
import { PublicBosqueMagicoController } from './presentation/public.controller';
import { TareasEventoController } from './presentation/tareas-evento.controller';
import { SolicitudesController } from './presentation/solicitudes.controller';
import { ContratosController } from './presentation/contratos.controller';
import { ClientesController } from './presentation/clientes.controller';
import { ListarClientesUseCase } from './application/use-cases/listar-clientes.use-case';
import { ObtenerClienteUseCase } from './application/use-cases/obtener-cliente.use-case';
import { ResolverIdentidadContactoUseCase } from './application/use-cases/resolver-identidad-contacto.use-case';
import { GenerarContratoEventoUseCase } from './application/use-cases/generar-contrato-evento.use-case';
import { ListarContratosUseCase } from './application/use-cases/listar-contratos.use-case';
import {
  MarcarContratoEnviadoUseCase,
  MarcarContratoFirmadoUseCase,
} from './application/use-cases/marcar-contrato-estado.use-case';
import {
  EliminarAdjuntoContratoUseCase,
  SubirAdjuntoContratoUseCase,
} from './application/use-cases/gestionar-adjunto-contrato.use-case';
import {
  ObtenerContratoPorEventoUseCase,
  ObtenerContratoUseCase,
} from './application/use-cases/obtener-contrato.use-case';

@Module({
  imports: [EventsModule],
  controllers: [
    PublicBosqueMagicoController,
    SolicitudesController,
    ClientesController,
    CotizacionesController,
    EventosController,
    ContratosController,
    ConfiguracionController,
    ProductosController,
    ProveedoresController,
    PedidosController,
    TareasEventoController,
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
    ProductoMediaRepository,
    ComposicionPaqueteRepository,
    ProveedoresRepository,
    PedidosRepository,
    TareasEventoRepository,
    EventosRepository,
    ContratosRepository,
    ContratoAdjuntosRepository,
    SecuenciasRepository,
    CalculoPreciosService,
    ComposicionPaqueteService,
    SolicitudCotizacionSyncService,
    SmtpService,
    PostventaService,
    NotificacionProveedorService,
    ProductoMediaSyncService,
    AnticipacionEventoService,
    PrecondicionesEventoService,
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
    EnviarPedidoProveedorCorreoUseCase,
    AceptarCotizacionUseCase,
    ListarProductosUseCase,
    ListarProductosPanelUseCase,
    CrearProductoUseCase,
    ListarProveedoresUseCase,
    CrearProveedorUseCase,
    ActualizarProveedorUseCase,
    ListarPedidosEventoUseCase,
    CrearPedidoUseCase,
    ActualizarPedidoUseCase,
    GenerarPedidosEventoUseCase,
    ListarPedidosOperacionesUseCase,
    ListarTareasEventoUseCase,
    CrearTareaEventoUseCase,
    ActualizarTareaEventoUseCase,
    GenerarTareasEventoUseCase,
    ActualizarProductoUseCase,
    ListarEventosUseCase,
    ObtenerAgendaUseCase,
    ActualizarEventoUseCase,
    ConfirmarEventoUseCase,
    RealizarEventoUseCase,
    CancelarEventoUseCase,
    GenerarContratoEventoUseCase,
    ObtenerContratoUseCase,
    ObtenerContratoPorEventoUseCase,
    ListarContratosUseCase,
    MarcarContratoEnviadoUseCase,
    MarcarContratoFirmadoUseCase,
    ListarAuditoriaUseCase,
    SubirImagenProductoUseCase,
    EliminarImagenProductoUseCase,
    GestionarMediaProductoUseCase,
    PrevisualizarCotizacionPublicaUseCase,
    ObtenerContratoPublicoUseCase,
    ObtenerPedidoPublicoUseCase,
    ResponderPedidoPublicoUseCase,
    SubirAdjuntoContratoUseCase,
    EliminarAdjuntoContratoUseCase,
  ],
})
export class BosqueMagicoModule {}
