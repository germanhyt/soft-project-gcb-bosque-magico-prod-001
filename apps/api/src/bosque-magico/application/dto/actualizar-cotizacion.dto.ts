import { ApiPropertyOptional } from '@nestjs/swagger';
import { TurnoInteres } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ItemCotizacionDto } from './item-cotizacion.dto';

export class ActualizarCotizacionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaEvento?: string;

  @ApiPropertyOptional({ enum: TurnoInteres })
  @IsOptional()
  @IsEnum(TurnoInteres)
  turno?: TurnoInteres;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  cantidadNinos?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tematica?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paquete?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiPropertyOptional({ type: [ItemCotizacionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCotizacionDto)
  items?: ItemCotizacionDto[];
}
