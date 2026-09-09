import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class PropuestaCostoPedidoPublicoDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costoEstimado!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
