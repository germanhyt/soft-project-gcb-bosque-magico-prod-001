import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SeleccionPaqueteDto } from './seleccion-paquete.dto';

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

  @ApiProperty({ example: 'Estándar' })
  @IsString()
  @IsNotEmpty({ message: 'Debe elegir un paquete' })
  @MaxLength(120)
  paquete!: string;

  @ApiPropertyOptional({ type: SeleccionPaqueteDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeleccionPaqueteDto)
  seleccion?: SeleccionPaqueteDto;

  /** @deprecated Usar seleccion; se tratan como adicionales fuera del paquete */
  @ApiPropertyOptional({ type: [ItemPreviewCotizacionPublicaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPreviewCotizacionPublicaDto)
  items?: ItemPreviewCotizacionPublicaDto[];
}
