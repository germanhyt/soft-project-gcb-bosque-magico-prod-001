import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mapCotizacionResponse } from '../../domain/mappers/cotizacion.mapper';
import {
  adelantosExcedenTotal,
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

    const total = fromDecimal(cot.montoTotal);
    const precontrato = armarPrecontrato({
      montoTotal: total,
      adelanto1Monto: dto.adelanto1Monto,
      adelanto1Fecha: dto.adelanto1Fecha,
      adelanto2Monto: dto.adelanto2Monto,
      adelanto2Fecha: dto.adelanto2Fecha,
      montoGarantia: dto.montoGarantia,
      generadoEn: new Date().toISOString(),
    });
    if (precontrato.adelanto1Monto <= 0) {
      throw new BadRequestException(
        'El adelanto debe ser mayor a cero y no superar el total cotizado',
      );
    }
    if (precontrato.adelanto2Monto > 0 && !esFechaCalendario(precontrato.adelanto2Fecha)) {
      throw new BadRequestException('Indica la fecha del segundo adelanto');
    }
    if (adelantosExcedenTotal(total, precontrato.adelanto1Monto, precontrato.adelanto2Monto)) {
      throw new BadRequestException('Los adelantos superan el total cotizado');
    }

    const actualizado = await this.cotizaciones.guardarPrecontrato(
      id,
      precontrato as unknown as Prisma.InputJsonValue,
    );
    return mapCotizacionResponse(actualizado);
  }
}
