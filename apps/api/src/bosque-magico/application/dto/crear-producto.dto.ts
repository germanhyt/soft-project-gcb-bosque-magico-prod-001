import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoriaProducto } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CrearProductoDto {
  @ApiProperty({ example: 'SHOW-NUEVO' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  codigo!: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}
