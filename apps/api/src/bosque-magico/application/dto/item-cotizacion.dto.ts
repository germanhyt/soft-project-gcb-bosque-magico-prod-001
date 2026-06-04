import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoItemCotizacion } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class ItemCotizacionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productoId?: string;

  @ApiProperty({ enum: TipoItemCotizacion })
  @IsEnum(TipoItemCotizacion)
  tipo!: TipoItemCotizacion;

  @ApiProperty()
  @IsString()
  nombre!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  cantidad!: number;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(0)
  precioUnitario!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}
