import { ApiPropertyOptional } from '@nestjs/swagger';
import { TurnoInteres } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class ActualizarSolicitudDto {
  @ApiPropertyOptional({ example: 'María López' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombreContacto?: string;

  @ApiPropertyOptional({ example: '999888777' })
  @IsOptional()
  @IsString()
  @MinLength(9)
  @MaxLength(40)
  celular?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  correo?: string;

  @ApiPropertyOptional({ example: '2026-07-20' })
  @IsOptional()
  @IsString()
  fechaTentativa?: string;

  @ApiPropertyOptional({ enum: TurnoInteres, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsEnum(TurnoInteres)
  turnoInteres?: TurnoInteres | null;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  cantidadNinosEstimada?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 datetime' })
  @IsOptional()
  @IsISO8601()
  proximoSeguimientoEn?: string;

  @ApiPropertyOptional({
    description: 'Registrar último contacto (ISO 8601); por defecto ahora',
  })
  @IsOptional()
  @IsISO8601()
  ultimoContactoEn?: string;
}
