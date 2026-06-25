import { IsString, MaxLength, MinLength } from 'class-validator';

export class GuardarVideoProductoDto {
  @IsString()
  @MinLength(4)
  @MaxLength(2048)
  url!: string;
}
