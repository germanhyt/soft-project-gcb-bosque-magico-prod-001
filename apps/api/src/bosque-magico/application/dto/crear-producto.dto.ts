import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CategoriaProducto,
  OrigenProducto,
  SubtipoProducto,
} from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CrearProductoDto {
  @ApiPropertyOptional({
    example: 'SHOW-004',
    description:
      'Opcional. Si se omite, el sistema asigna un código correlativo según categoría.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  codigo?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ enum: CategoriaProducto })
  @IsEnum(CategoriaProducto)
  categoria!: CategoriaProducto;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  precioLunesViernes!: number;

  @ApiProperty({ example: 240 })
  @IsNumber()
  @Min(0)
  precioFinSemana!: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidadMinima?: number;

  @ApiPropertyOptional({
    enum: SubtipoProducto,
    default: SubtipoProducto.general,
  })
  @IsOptional()
  @IsEnum(SubtipoProducto)
  subtipo?: SubtipoProducto;

  @ApiPropertyOptional({
    description:
      'Unidades por pack (piqueos). Precio del producto es por pack completo.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  unidadesPack?: number;

  @ApiPropertyOptional({
    example: 'hora',
    description: 'Unidad de cobro (hora, bloque 3h, servicio)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  unidad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ enum: OrigenProducto, default: OrigenProducto.propio })
  @IsOptional()
  @IsEnum(OrigenProducto)
  origen?: OrigenProducto;

  @ApiPropertyOptional({ description: 'Costo interno / proveedor (S/)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costoInterno?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  proveedorId?: string;
}
