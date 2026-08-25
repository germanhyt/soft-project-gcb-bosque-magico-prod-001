import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class EnviarCorreoContactoDto {
  @ApiProperty({ example: 'cliente@correo.com' })
  @IsEmail({}, { message: 'Ingresa un correo válido' })
  @MaxLength(150)
  correoDestino!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Indica el asunto' })
  @MaxLength(200)
  asunto!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Indica el mensaje' })
  @MaxLength(8000)
  cuerpo!: string;
}
