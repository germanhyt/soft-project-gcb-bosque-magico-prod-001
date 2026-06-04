import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemPreviewCotizacionPublicaDto {
  @ApiProperty()
  @IsUUID()
  productoId!: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class PrevisualizarCotizacionPublicaDto {
  @ApiProperty({ example: '2026-08-15' })
  @IsString()
  fechaEvento!: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  @Max(50)
  cantidadNinos!: number;

  @ApiPropertyOptional({ example: 'Estándar' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  paquete?: string;

  @ApiPropertyOptional({ type: [ItemPreviewCotizacionPublicaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPreviewCotizacionPublicaDto)
  items?: ItemPreviewCotizacionPublicaDto[];
}
