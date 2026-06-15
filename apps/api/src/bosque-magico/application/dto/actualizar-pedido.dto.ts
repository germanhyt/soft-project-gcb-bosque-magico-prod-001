import { ApiPropertyOptional } from '@nestjs/swagger';
import { AreaPedido, EtapaPedido } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ActualizarPedidoDto {
  @ApiPropertyOptional({ enum: EtapaPedido })
  @IsOptional()
  @IsEnum(EtapaPedido)
  etapa?: EtapaPedido;

  @ApiPropertyOptional({ enum: AreaPedido })
  @IsOptional()
  @IsEnum(AreaPedido)
  area?: AreaPedido;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaRequerida?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;
}
