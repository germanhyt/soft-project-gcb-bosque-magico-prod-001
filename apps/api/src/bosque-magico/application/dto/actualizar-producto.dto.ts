import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CategoriaProducto,
  EtapaProducto,
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

export class ActualizarProductoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ enum: CategoriaProducto })
  @IsOptional()
  @IsEnum(CategoriaProducto)
  categoria?: CategoriaProducto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioLunesViernes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioFinSemana?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidadMinima?: number;

  @ApiPropertyOptional({ enum: SubtipoProducto })
  @IsOptional()
  @IsEnum(SubtipoProducto)
  subtipo?: SubtipoProducto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  unidadesPack?: number | null;

  @ApiPropertyOptional({ example: 'hora' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  unidad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ enum: EtapaProducto })
  @IsOptional()
  @IsEnum(EtapaProducto)
  etapa?: EtapaProducto;

  @ApiPropertyOptional({ enum: OrigenProducto })
  @IsOptional()
  @IsEnum(OrigenProducto)
  origen?: OrigenProducto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  costoInterno?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  proveedorId?: string | null;
}
