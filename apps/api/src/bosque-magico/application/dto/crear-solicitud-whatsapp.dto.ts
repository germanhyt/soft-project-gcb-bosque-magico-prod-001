import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CanalSolicitud, TurnoInteres } from '@prisma/client';

export class CrearSolicitudWhatsappDto {
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

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  correo?: string;

  @ApiProperty({ example: '2026-07-20' })
  @IsString()
  fechaTentativa!: string;

  @ApiProperty({ enum: TurnoInteres })
  @IsEnum(TurnoInteres)
  turnoInteres!: TurnoInteres;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1, { message: 'Debe haber al menos 1 niño' })
  @Max(100, { message: 'La cantidad de niños supera el máximo permitido' })
  cantidadNinosEstimada!: number;

  @ApiPropertyOptional({
    enum: CanalSolicitud,
    default: CanalSolicitud.whatsapp,
  })
  @IsOptional()
  @IsEnum(CanalSolicitud)
  canal?: CanalSolicitud;

  @ApiPropertyOptional({
    example: 'instagram',
    description: 'Detalle de origen declarado o inferido',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  detalleOrigen?: string;

  @ApiPropertyOptional({
    description: 'Notas para el equipo comercial',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;

  @ApiPropertyOptional({ example: 'Sofía' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombreCumpleanero?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  edadCumpleanero?: number;

  @ApiPropertyOptional({ example: 'Princesas' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tematica?: string;

  @ApiPropertyOptional({ example: 'Premium' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  paqueteInteres?: string;

  @ApiPropertyOptional({
    description:
      'Payload técnico (texto original, confianza, metadatos del canal)',
  })
  @IsOptional()
  @IsObject()
  payloadOrigen?: Record<string, unknown>;
}
