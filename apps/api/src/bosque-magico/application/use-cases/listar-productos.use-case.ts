import { Injectable } from '@nestjs/common';
import { ListarProductosPanelUseCase } from './listar-productos-panel.use-case';

/** Cotizador: solo productos activos */
@Injectable()
export class ListarProductosUseCase {
  constructor(private readonly listar: ListarProductosPanelUseCase) {}

  ejecutar() {
    return this.listar.ejecutar(true);
  }
}
