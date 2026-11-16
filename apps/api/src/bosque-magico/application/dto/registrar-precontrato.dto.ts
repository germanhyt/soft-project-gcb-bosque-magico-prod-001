import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches, Min, ValidateIf } from 'class-validator';

export class RegistrarPrecontratoDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0.01)
  adelanto1Monto!: number;

  @ApiProperty({ example: '2026-11-20' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  adelanto1Fecha!: string;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  adelanto2Monto?: number;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsOptional()
  @ValidateIf((dto: RegistrarPrecontratoDto) => (dto.adelanto2Monto ?? 0) > 0)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  adelanto2Fecha?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montoGarantia?: number;
}
