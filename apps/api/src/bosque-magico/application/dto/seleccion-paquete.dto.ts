import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemCantidadSeleccionDto {
  @IsUUID()
  productoId!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class HorarioProductoSeleccionDto {
  @IsUUID()
  productoId!: string;

  @ApiPropertyOptional({ example: '16:00' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'El horario de inicio debe ser HH:mm',
  })
  inicio?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'El horario de fin debe ser HH:mm',
  })
  fin?: string;
}

export class SeleccionPaqueteDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  showIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  extraIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  snackId?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Unidades solicitadas para carrito snack Premium (0 = usar incluidas)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  snackCantidad?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cajitasCantidad?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Cantidad de cajitas clásicas',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  cajitasClasica?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Cantidad de cajitas saludables',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  cajitasSaludable?: number;

  @ApiPropertyOptional({ type: [ItemCantidadSeleccionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCantidadSeleccionDto)
  piqueos?: ItemCantidadSeleccionDto[];

  @ApiPropertyOptional({ type: [ItemCantidadSeleccionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCantidadSeleccionDto)
  adicionales?: ItemCantidadSeleccionDto[];

  @ApiPropertyOptional({ type: [HorarioProductoSeleccionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioProductoSeleccionDto)
  horarios?: HorarioProductoSeleccionDto[];

  @ApiPropertyOptional({
    example: 0,
    description: 'Unidades de salita lounge (8 pax)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  salitaLoungeCantidad?: number;

  @ApiPropertyOptional({ description: 'Derecho de ingreso de show externo' })
  @IsOptional()
  @IsBoolean()
  derechoIngresoShowExterno?: boolean;

  @ApiPropertyOptional({
    description: 'Derecho de ingreso de decoración externo',
  })
  @IsOptional()
  @IsBoolean()
  derechoIngresoDecoracionExterno?: boolean;

  @ApiPropertyOptional({
    description: 'Derecho de ingreso de carrito snack externo',
  })
  @IsOptional()
  @IsBoolean()
  derechoIngresoCarritoSnackExterno?: boolean;

  @ApiPropertyOptional({ description: 'Derechos de decoración personalizada' })
  @IsOptional()
  @IsBoolean()
  derechoDecoracionPersonalizada?: boolean;

  @ApiPropertyOptional({ description: 'Override de precio salita lounge (S/)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioSalitaLounge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioDerechoIngresoShowExterno?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioDerechoIngresoDecoracionExterno?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioDerechoIngresoCarritoSnackExterno?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioDerechoDecoracionPersonalizada?: number;
}
