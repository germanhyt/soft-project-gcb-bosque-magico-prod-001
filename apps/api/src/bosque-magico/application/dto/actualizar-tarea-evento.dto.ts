import { ApiPropertyOptional } from '@nestjs/swagger';
import { AreaPedido, EtapaTareaEvento } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarTareaEventoDto {
  @ApiPropertyOptional({ enum: EtapaTareaEvento })
  @IsOptional()
  @IsEnum(EtapaTareaEvento)
  etapa?: EtapaTareaEvento;

  @ApiPropertyOptional({ enum: AreaPedido })
  @IsOptional()
  @IsEnum(AreaPedido)
  area?: AreaPedido;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  responsable?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaVencimiento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;
}
