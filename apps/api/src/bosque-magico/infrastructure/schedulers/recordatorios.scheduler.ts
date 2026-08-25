import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  fechaCalendarioHoy,
  ZONA_NEGOCIO,
} from '../../domain/utils/fecha-calendario';
import { ProcesarRecordatoriosEventoUseCase } from '../../application/use-cases/procesar-recordatorios-evento.use-case';

/** Job diario ~08:00 America/Lima — recordatorios de eventos (sin @nestjs/schedule). */
@Injectable()
export class RecordatoriosScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecordatoriosScheduler.name);
  private timer?: ReturnType<typeof setInterval>;
  private lastRunDay: string | null = null;

  constructor(private readonly procesar: ProcesarRecordatoriosEventoUseCase) {}

  onModuleInit() {
    // Cada 15 min; dispara una vez al día cuando la hora Lima es >= 8.
    this.timer = setInterval(
      () => {
        void this.tick();
      },
      15 * 60 * 1000,
    );
    // Primera pasada a los 45s (dar tiempo a que arranque la app).
    setTimeout(() => void this.tick(), 45_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private horaLima(): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ZONA_NEGOCIO,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find((p) => p.type === 'hour')?.value;
    return Number(h ?? 0);
  }

  private async tick() {
    const hoy = fechaCalendarioHoy();
    if (this.lastRunDay === hoy) return;
    if (this.horaLima() < 8) return;

    this.lastRunDay = hoy;
    try {
      const res = await this.procesar.ejecutar();
      this.logger.log(
        `Recordatorios: habilitado=${res.habilitado} objetivo=${res.fechaObjetivo} enviados=${res.enviados}/${res.revisados}`,
      );
    } catch (err) {
      this.lastRunDay = null;
      this.logger.error('Recordatorios falló', err);
    }
  }
}
