import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CanalEnvio } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class EnviarCotizacionDto {
  @ApiProperty({ enum: CanalEnvio })
  @IsEnum(CanalEnvio)
  canal!: CanalEnvio;

  @ApiPropertyOptional({ description: 'Correo destino si canal es email' })
  @IsOptional()
  @IsEmail()
  correoDestino?: string;

  @ApiPropertyOptional({ description: 'Celular destino si canal es whatsapp' })
  @IsOptional()
  @IsString()
  celularDestino?: string;
}
