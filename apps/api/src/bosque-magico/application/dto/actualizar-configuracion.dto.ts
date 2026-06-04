import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Allow, IsArray, IsString, ValidateNested } from 'class-validator';

export class ConfiguracionValorDto {
  @ApiProperty({ example: 'tarifas.base_lunes_viernes' })
  @IsString()
  clave!: string;

  @ApiProperty({
    description:
      'Número para tarifas/límites/puerto SMTP, string para textos SMTP/cotizador, boolean para SMTP secure u objeto de turno',
    oneOf: [
      { type: 'number', example: 380 },
      { type: 'string', example: 'smtp.example.com' },
      { type: 'boolean', example: false },
      {
        type: 'object',
        example: { etiqueta: 'Turno 1', horario: '9:00 a.m. - 12:00 m.' },
      },
    ],
  })
  @Allow()
  valor!: number | { etiqueta: string; horario: string };
}

export class ActualizarConfiguracionDto {
  @ApiProperty({ type: [ConfiguracionValorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfiguracionValorDto)
  actualizaciones!: ConfiguracionValorDto[];
}
