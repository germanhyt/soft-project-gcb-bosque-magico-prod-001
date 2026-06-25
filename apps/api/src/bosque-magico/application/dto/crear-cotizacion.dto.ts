import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TurnoInteres } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ItemCotizacionDto } from './item-cotizacion.dto';
import { SeleccionPaqueteDto } from './seleccion-paquete.dto';

export class ClienteCotizacionDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombreCompleto!: string;

  @ApiProperty()
  @IsString()
  @MinLength(9)
  celular!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  correo?: string;
}

export class CumpleaneroCotizacionDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  edad?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tematicaFavorita?: string;
}

export class CrearCotizacionDto {
  @ApiPropertyOptional({ description: 'Solicitud origen (recomendado)' })
  @IsOptional()
  @IsUUID()
  solicitudId?: string;

  @ApiProperty({ type: ClienteCotizacionDto })
  @ValidateNested()
  @Type(() => ClienteCotizacionDto)
  cliente!: ClienteCotizacionDto;

  @ApiProperty({ type: CumpleaneroCotizacionDto })
  @ValidateNested()
  @Type(() => CumpleaneroCotizacionDto)
  cumpleanero!: CumpleaneroCotizacionDto;

  @ApiProperty({ example: '2026-08-15' })
  @IsString()
  fechaEvento!: string;

  @ApiProperty({ enum: TurnoInteres })
  @IsEnum(TurnoInteres)
  turno!: TurnoInteres;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  @Max(50)
  cantidadNinos!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tematica?: string;

  @ApiProperty({ example: 'Estándar' })
  @IsString()
  @IsNotEmpty({ message: 'Debe elegir un paquete' })
  paquete!: string;

  @ApiPropertyOptional({ type: SeleccionPaqueteDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeleccionPaqueteDto)
  seleccion?: SeleccionPaqueteDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;

  /** Ítems manuales adicionales (legacy); preferir seleccion.adicionales */
  @ApiPropertyOptional({ type: [ItemCotizacionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCotizacionDto)
  items?: ItemCotizacionDto[];
}
