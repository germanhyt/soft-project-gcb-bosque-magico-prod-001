import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AreaPedido } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CrearTareaEventoDto {
  @ApiProperty({ enum: AreaPedido })
  @IsEnum(AreaPedido)
  area!: AreaPedido;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  responsable?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaVencimiento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;
}
