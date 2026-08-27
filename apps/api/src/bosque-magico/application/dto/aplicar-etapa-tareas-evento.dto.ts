import { ApiProperty } from '@nestjs/swagger';
import { EtapaTareaEvento } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class AplicarEtapaTareasEventoDto {
  @ApiProperty({ enum: EtapaTareaEvento })
  @IsEnum(EtapaTareaEvento, { message: 'Indica un estado válido para el checklist' })
  etapa!: EtapaTareaEvento;
}
