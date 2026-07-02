import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class EnviarPedidoProveedorCorreoDto {
  @ApiPropertyOptional({ description: 'Asunto personalizado' })
  @IsOptional()
  @IsString()
  correoAsunto?: string;

  @ApiPropertyOptional({ description: 'Cuerpo personalizado' })
  @IsOptional()
  @IsString()
  correoCuerpo?: string;
}
