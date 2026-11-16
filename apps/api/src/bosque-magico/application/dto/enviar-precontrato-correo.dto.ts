import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class EnviarPrecontratoCorreoDto {
  @ApiPropertyOptional({ description: 'Correo destino; si se omite se usa el del cliente' })
  @IsOptional()
  @IsEmail({}, { message: 'Ingresa un correo válido' })
  correoDestino?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  correoAsunto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  correoCuerpo?: string;
}
