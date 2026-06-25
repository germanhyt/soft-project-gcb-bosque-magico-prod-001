import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RechazarPedidoPublicoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
