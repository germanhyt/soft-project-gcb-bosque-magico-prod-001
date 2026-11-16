import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mapCotizacionResponse } from '../../domain/mappers/cotizacion.mapper';
import {
  armarPrecontrato,
  puedeEntregarPrecontrato,
} from '../../domain/utils/precontrato';
import { esFechaCalendario } from '../../domain/utils/fecha-calendario';
import { fromDecimal } from '../../domain/utils/decimal';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { RegistrarPrecontratoDto } from '../dto/registrar-precontrato.dto';

@Injectable()
export class RegistrarPrecontratoUseCase {
  constructor(private readonly cotizaciones: CotizacionesRepository) {}

  async ejecutar(id: string, dto: RegistrarPrecontratoDto) {
    const cot = await this.cotizaciones.obtenerPorId(id);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    if (!puedeEntregarPrecontrato(cot.etapa)) {
      throw new BadRequestException(
        'El precontrato se entrega con la cotización en borrador o enviada',
      );
    }
    if (!esFechaCalendario(dto.adelanto1Fecha)) {
      throw new BadRequestException('Indica la fecha del adelanto');
    }

    const precontrato = armarPrecontrato({
      montoTotal: fromDecimal(cot.montoTotal),
      adelanto1Monto: dto.adelanto1Monto,
      adelanto1Fecha: dto.adelanto1Fecha,
      generadoEn: new Date().toISOString(),
    });
    if (precontrato.adelanto1Monto <= 0) {
      throw new BadRequestException(
        'El adelanto debe ser mayor a cero y no superar el total cotizado',
      );
    }

    const actualizado = await this.cotizaciones.guardarPrecontrato(
      id,
      precontrato as unknown as Prisma.InputJsonValue,
    );
    return mapCotizacionResponse(actualizado);
  }
}
