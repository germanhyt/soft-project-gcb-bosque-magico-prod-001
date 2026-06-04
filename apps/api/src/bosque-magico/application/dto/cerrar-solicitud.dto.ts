import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MotivoCierreSolicitud } from '@prisma/client';

export class CerrarSolicitudDto {
  @ApiProperty({ enum: MotivoCierreSolicitud })
  @IsEnum(MotivoCierreSolicitud)
  motivoCierre!: MotivoCierreSolicitud;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;
}
