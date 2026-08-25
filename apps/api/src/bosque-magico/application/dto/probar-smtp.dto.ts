import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class ProbarSmtpDto {
  @ApiProperty({ example: 'operador@ejemplo.com' })
  @IsEmail({}, { message: 'Ingresa un correo válido' })
  @MaxLength(150)
  correoDestino!: string;
}
