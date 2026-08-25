import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
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
  @Min(1, { message: 'Debe haber al menos 1 niño' })
  @Max(100, { message: 'La cantidad de niños supera el máximo permitido' })
  cantidadNinos!: number;

  @ApiPropertyOptional({
    enum: ['paquete', 'solo_espacio'],
    default: 'paquete',
  })
  @IsOptional()
  @IsIn(['paquete', 'solo_espacio'])
  modalidad?: 'paquete' | 'solo_espacio';

  @ApiPropertyOptional({ example: 'Estándar' })
  @ValidateIf((o) => o.modalidad !== 'solo_espacio')
  @IsString()
  @IsNotEmpty({ message: 'Debe elegir un paquete' })
  @MaxLength(120)
  paquete?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Horas adicionales a las 3 h incluidas',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(8)
  horasAdicionales?: number;

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
