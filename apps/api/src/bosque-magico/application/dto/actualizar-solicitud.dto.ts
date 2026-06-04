import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarSolicitudDto {
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
