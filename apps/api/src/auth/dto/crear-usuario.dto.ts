import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsString,
  MinLength,
} from 'class-validator';

export class CrearUsuarioDto {
  @ApiProperty({ example: 'vendedor@bosquemagico.test' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: ['bosque_magico:view', 'bosque_magico:manage'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permisos!: string[];
}
