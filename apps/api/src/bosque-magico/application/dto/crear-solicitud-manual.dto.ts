import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CanalSolicitud, EtapaSolicitud, TurnoInteres } from '@prisma/client';

export class CrearSolicitudManualDto {
  @ApiProperty({ example: 'María López' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombreContacto!: string;

  @ApiProperty({ example: '999888777' })
  @IsString()
  @MinLength(9)
  @MaxLength(40)
  celular!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  correo?: string;

  @ApiPropertyOptional({ enum: CanalSolicitud, default: CanalSolicitud.manual })
  @IsOptional()
  @IsEnum(CanalSolicitud)
  canal?: CanalSolicitud;

  @ApiPropertyOptional({ example: '2026-07-20' })
  @IsOptional()
  @IsString()
  fechaTentativa?: string;

  @ApiPropertyOptional({ enum: TurnoInteres })
  @IsOptional()
  @IsEnum(TurnoInteres)
  turnoInteres?: TurnoInteres;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Debe haber al menos 1 niño' })
  @Max(100, { message: 'La cantidad de niños supera el máximo permitido' })
  cantidadNinosEstimada?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;

  @ApiPropertyOptional({
    enum: EtapaSolicitud,
    description: 'Por defecto nueva; en_atencion si ya se está gestionando',
  })
  @IsOptional()
  @IsEnum(EtapaSolicitud)
  etapaInicial?: EtapaSolicitud;
}
