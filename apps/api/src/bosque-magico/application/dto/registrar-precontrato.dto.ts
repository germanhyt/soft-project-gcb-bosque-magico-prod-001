import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Matches, Min } from 'class-validator';

export class RegistrarPrecontratoDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0.01)
  adelanto1Monto!: number;

  @ApiProperty({ example: '2026-11-20' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  adelanto1Fecha!: string;
}
