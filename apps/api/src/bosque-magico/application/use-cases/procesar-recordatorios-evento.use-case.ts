import { Injectable } from '@nestjs/common';
import { RecordatorioEventoService } from '../../domain/services/recordatorio-evento.service';

@Injectable()
export class ProcesarRecordatoriosEventoUseCase {
  constructor(private readonly recordatorios: RecordatorioEventoService) {}

  ejecutar() {
    return this.recordatorios.procesarVentana();
  }
}
