import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
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
}