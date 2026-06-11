import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoComprobanteContrato } from '@prisma/client';

export class GenerarContratoDto {
  @ApiProperty({ example: '12345678' })
  @IsString()
  @MaxLength(30)
  numeroDocumento!: string;

  @ApiProperty({ enum: TipoComprobanteContrato })
  @IsEnum(TipoComprobanteContrato)
  tipoComprobante!: TipoComprobanteContrato;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @MaxLength(30)
  documentoTributario!: string;

  @ApiProperty({ example: '9:00 a.m.' })
  @IsString()
  @MaxLength(40)
  horarioInicio!: string;

  @ApiProperty({ example: '12:00 m.' })
  @IsString()
  @MaxLength(40)
  horarioFin!: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  adelanto1Monto!: number;

  @ApiPropertyOptional({ example: '2026-06-10' })
  @IsOptional()
  @IsDateString()
  adelanto1Fecha?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  adelanto2Monto?: number;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  adelanto2Fecha?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montoGarantia?: number;
}
