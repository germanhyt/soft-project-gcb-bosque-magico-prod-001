import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
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
  ValidateNested,
} from 'class-validator';
import { CanalSolicitud, TurnoInteres } from '@prisma/client';

export class ClienteSolicitudDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre!: string;

  @ApiProperty({ example: '999888777' })
  @IsString()
  @MinLength(9)
  @MaxLength(40)
  celular!: string;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  correo?: string;
}

export class CumpleaneroSolicitudDto {
  @ApiPropertyOptional({ example: 'Sofía' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  edad?: number;
}

export class EventoSolicitudDto {
  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsString()
  fechaTentativa?: string;

  @ApiPropertyOptional({ enum: TurnoInteres })
  @IsOptional()
  @IsEnum(TurnoInteres)
  turno?: TurnoInteres;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Debe haber al menos 1 niño' })
  @Max(100, { message: 'La cantidad de niños supera el máximo permitido' })
  cantidadNinos?: number;

  @ApiPropertyOptional({ example: 'Princesas' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tematica?: string;

  @ApiPropertyOptional({ example: 'Premium' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  paquete?: string;
}

export class OrigenSolicitudPublicaDto {
  @ApiPropertyOptional({
    enum: CanalSolicitud,
    default: CanalSolicitud.landing,
  })
  @IsOptional()
  @IsEnum(CanalSolicitud)
  canal?: CanalSolicitud;

  @ApiPropertyOptional({
    example: 'instagram',
    description:
      'Detalle de origen declarado o inferido (ej. instagram, referido)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  detalle?: string;

  @ApiPropertyOptional({
    description: 'Payload técnico de trazabilidad del canal/origen',
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class CrearSolicitudPublicaDto {
  @ApiProperty({ type: ClienteSolicitudDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => ClienteSolicitudDto)
  cliente!: ClienteSolicitudDto;

  @ApiPropertyOptional({ type: CumpleaneroSolicitudDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CumpleaneroSolicitudDto)
  cumpleanero?: CumpleaneroSolicitudDto;

  @ApiPropertyOptional({ type: EventoSolicitudDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventoSolicitudDto)
  evento?: EventoSolicitudDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Payload libre de preferencias (show, catering, etc.)',
  })
  @IsOptional()
  @IsObject()
  preferencias?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: OrigenSolicitudPublicaDto,
    description: 'Canal y detalle de origen del lead',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrigenSolicitudPublicaDto)
  origen?: OrigenSolicitudPublicaDto;
}
