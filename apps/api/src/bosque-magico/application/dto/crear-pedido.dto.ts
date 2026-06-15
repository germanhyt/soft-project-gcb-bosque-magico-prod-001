import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AreaPedido, TipoPedido } from '@prisma/client';
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

export class CrearPedidoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @ApiProperty({ enum: TipoPedido })
  @IsEnum(TipoPedido)
  tipo!: TipoPedido;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  nombre!: string;

  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(1)
  cantidad!: number;

  @ApiProperty({ enum: AreaPedido })
  @IsEnum(AreaPedido)
  area!: AreaPedido;

  @ApiPropertyOptional({ example: '2026-06-20' })
  @IsOptional()
  @IsString()
  fechaRequerida?: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(0)
  costo!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;
}
