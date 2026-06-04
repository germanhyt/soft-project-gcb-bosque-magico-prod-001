import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelarEventoDto {
  @ApiPropertyOptional({ description: 'Motivo u observación de cancelación' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
