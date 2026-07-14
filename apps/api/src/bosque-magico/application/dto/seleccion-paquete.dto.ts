import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
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

  @ApiPropertyOptional({ example: 25, description: 'Unidades solicitadas para carrito snack Premium' })
  @IsOptional()
  @IsInt()
  @Min(25)
  snackCantidad?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(10)
  cajitasCantidad?: number;

  @ApiPropertyOptional({ example: 10, description: 'Cantidad de cajitas clásicas' })
  @IsOptional()
  @IsInt()
  @Min(0)
  cajitasClasica?: number;

  @ApiPropertyOptional({ example: 0, description: 'Cantidad de cajitas saludables' })
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

  @ApiPropertyOptional({ example: 0, description: 'Unidades de salita lounge (8 pax)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  salitaLoungeCantidad?: number;

  @ApiPropertyOptional({ description: 'Derecho de ingreso de show externo' })
  @IsOptional()
  @IsBoolean()
  derechoIngresoShowExterno?: boolean;

  @ApiPropertyOptional({ description: 'Derecho de ingreso de decoración externo' })
  @IsOptional()
  @IsBoolean()
  derechoIngresoDecoracionExterno?: boolean;

  @ApiPropertyOptional({ description: 'Derecho de ingreso de carrito snack externo' })
  @IsOptional()
  @IsBoolean()
  derechoIngresoCarritoSnackExterno?: boolean;
}