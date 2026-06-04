import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ActualizarConfiguracionDto } from '../dto/actualizar-configuracion.dto';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

const CLAVES_NUMERICAS_PERMITIDAS = new Set([
  'tarifas.base_lunes_viernes',
  'tarifas.base_fin_semana',
  'tarifas.precio_nino_extra',
  'ninos.minimo',
  'ninos.maximo_base',
  'ninos.maximo_permitido',
  'contrato.adelanto_referencial',
  'contrato.garantia_referencial',
  'catering.minimo_unidades',
  'smtp.port',
]);

const CLAVES_TURNOS = new Set([
  'turnos.turno_1',
  'turnos.turno_2',
  'turnos.turno_3',
]);

const CLAVES_SELECTION_MODE = new Set([
  'cotizador.shows.selection_mode',
  'cotizador.catering.selection_mode',
  'cotizador.extras.selection_mode',
]);

const CLAVES_SMTP_TEXTO = new Set([
  'smtp.host',
  'smtp.user',
  'smtp.password',
  'smtp.from_email',
  'smtp.from_name',
]);

const CLAVES_SMTP_BOOLEAN = new Set(['smtp.secure']);

function parseSelectionMode(valor: unknown): 'single' | 'multiple' {
  if (valor === 'single' || valor === 'multiple') return valor;
  throw new BadRequestException(
    'Modo de selección inválido (use single o multiple)',
  );
}

function parseTexto(valor: unknown, clave: string) {
  if (typeof valor !== 'string') {
    throw new BadRequestException(`Valor de texto inválido: ${clave}`);
  }
  return valor.trim();
}

function parseBoolean(valor: unknown, clave: string) {
  if (typeof valor !== 'boolean') {
    throw new BadRequestException(`Valor booleano inválido: ${clave}`);
  }
  return valor;
}

function formatHora12(hhmm: string) {
  const [hStr, mStr] = hhmm.split(':');
  let h = Number(hStr);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

function parseTurnoValor(valor: unknown): {
  etiqueta: string;
  horaInicio: string;
  horaFin: string;
  horario: string;
} {
  if (!valor || typeof valor !== 'object') {
    throw new BadRequestException('Valor de turno inválido');
  }
  const v = valor as Record<string, unknown>;
  const etiqueta = typeof v.etiqueta === 'string' ? v.etiqueta.trim() : '';
  if (!etiqueta) throw new BadRequestException('Turno requiere etiqueta');

  if (typeof v.horaInicio === 'string' && typeof v.horaFin === 'string') {
    const horaInicio = v.horaInicio.trim();
    const horaFin = v.horaFin.trim();
    if (!/^\d{2}:\d{2}$/.test(horaInicio) || !/^\d{2}:\d{2}$/.test(horaFin)) {
      throw new BadRequestException('Horas de turno inválidas (use HH:mm)');
    }
    return {
      etiqueta,
      horaInicio,
      horaFin,
      horario: `${formatHora12(horaInicio)} - ${formatHora12(horaFin)}`,
    };
  }

  const horario = typeof v.horario === 'string' ? v.horario.trim() : '';
  if (!horario)
    throw new BadRequestException('Turno requiere hora inicio y fin');
  return { etiqueta, horaInicio: '09:00', horaFin: '12:00', horario };
}

@Injectable()
export class ActualizarConfiguracionUseCase {
  constructor(
    private readonly configuracion: ConfiguracionRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(dto: ActualizarConfiguracionDto) {
    const resultados = [];
    for (const item of dto.actualizaciones) {
      const existente = await this.configuracion.obtenerPorClave(item.clave);
      if (!existente) {
        throw new BadRequestException(
          `Configuración no encontrada: ${item.clave}`,
        );
      }

      let valorGuardar: unknown;
      if (CLAVES_NUMERICAS_PERMITIDAS.has(item.clave)) {
        if (typeof item.valor !== 'number' || Number.isNaN(item.valor)) {
          throw new BadRequestException(
            `Valor numérico inválido: ${item.clave}`,
          );
        }
        valorGuardar = item.valor;
      } else if (CLAVES_TURNOS.has(item.clave)) {
        valorGuardar = parseTurnoValor(item.valor);
      } else if (CLAVES_SELECTION_MODE.has(item.clave)) {
        valorGuardar = parseSelectionMode(item.valor);
      } else if (CLAVES_SMTP_TEXTO.has(item.clave)) {
        valorGuardar = parseTexto(item.valor, item.clave);
      } else if (CLAVES_SMTP_BOOLEAN.has(item.clave)) {
        valorGuardar = parseBoolean(item.valor, item.clave);
      } else {
        throw new BadRequestException(`Clave no editable: ${item.clave}`);
      }

      const actualizado = await this.configuracion.actualizarValor(
        item.clave,
        valorGuardar,
      );
      resultados.push(actualizado);
      await this.auditoria.registrar({
        tipoEntidad: 'configuracion',
        entidadId: existente.id,
        accion: 'actualizar',
        actorTipo: 'admin',
        antes: JSON.parse(JSON.stringify(existente)) as Prisma.InputJsonValue,
        despues: JSON.parse(
          JSON.stringify(actualizado),
        ) as Prisma.InputJsonValue,
      });
    }
    return resultados;
  }
}
