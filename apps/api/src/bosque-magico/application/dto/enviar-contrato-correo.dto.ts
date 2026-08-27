import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class EnviarContratoCorreoDto {
  @ApiPropertyOptional({ description: 'Correo destino; si se omite se usa el del cliente' })
  @IsOptional()
  @IsEmail({}, { message: 'Ingresa un correo válido' })
  correoDestino?: string;

  @ApiPropertyOptional({ description: 'Asunto personalizado' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Indica el asunto' })
  @MaxLength(200)
  correoAsunto?: string;

  @ApiPropertyOptional({ description: 'Cuerpo personalizado' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Indica el mensaje' })
  @MaxLength(8000)
  correoCuerpo?: string;
}
