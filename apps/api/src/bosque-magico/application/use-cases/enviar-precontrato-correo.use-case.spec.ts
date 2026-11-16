import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EtapaCotizacion } from '@prisma/client';
import { SmtpService } from '../../domain/services/smtp.service';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { EnviarPrecontratoCorreoUseCase } from './enviar-precontrato-correo.use-case';

describe('EnviarPrecontratoCorreoUseCase', () => {
  const cotizaciones = { obtenerPorId: jest.fn() };
  const smtp = {
    estaActivo: jest.fn(),
    enviarCorreo: jest.fn(),
  };
  const config = { get: jest.fn().mockReturnValue('https://bosquemagico.gcbprojects.site') };

  const useCase = new EnviarPrecontratoCorreoUseCase(
    cotizaciones as unknown as CotizacionesRepository,
    smtp as unknown as SmtpService,
    config as unknown as ConfigService,
  );

  const cot = {
    id: 'cot-1',
    codigo: 'BM-1',
    etapa: EtapaCotizacion.enviada,
    tokenPublico: 'tok',
    montoBase: 800,
    montoNinosExtra: 0,
    montoItems: 0,
    montoTotal: 800,
    cliente: { nombreCompleto: 'Ana Ruiz', correo: 'ana@example.com', celular: '999' },
    precontrato: {
      adelanto1Monto: 500,
      adelanto1Fecha: '2026-11-20',
      adelanto2Monto: 200,
      adelanto2Fecha: '2026-12-01',
      montoGarantia: 500,
      terminosVersion: '2026-06',
      generadoEn: '2026-11-16T00:00:00.000Z',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cotizaciones.obtenerPorId.mockResolvedValue(cot);
    smtp.estaActivo.mockResolvedValue(false);
  });

  it('envía por SMTP el texto recibido y deja la etapa igual', async () => {
    smtp.estaActivo.mockResolvedValue(true);

    const res = await useCase.ejecutar('cot-1', {
      correoAsunto: 'Reserva BM-1',
      correoCuerpo: 'Hola Ana, tu precontrato: https://bosquemagico.gcbprojects.site/cotizacion/tok/precontrato',
    });

    expect(smtp.enviarCorreo).toHaveBeenCalledWith({
      destino: 'ana@example.com',
      asunto: 'Reserva BM-1',
      texto: expect.stringContaining('/cotizacion/tok/precontrato'),
    });
    expect(res.enviadoPorSmtp).toBe(true);
    expect(res.etapa).toBe(EtapaCotizacion.enviada);
  });

  it('sin SMTP devuelve el mensaje para el cliente de correo', async () => {
    const res = await useCase.ejecutar('cot-1', {
      correoAsunto: 'Reserva BM-1',
      correoCuerpo: 'Documento listo',
    });

    expect(smtp.enviarCorreo).not.toHaveBeenCalled();
    expect(res.enviadoPorSmtp).toBe(false);
    expect(res.correoCuerpo).toBe('Documento listo');
    expect(res.etapa).toBe(EtapaCotizacion.enviada);
  });

  it('exige un precontrato guardado', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({ ...cot, precontrato: null });

    await expect(useCase.ejecutar('cot-1', {})).rejects.toBeInstanceOf(BadRequestException);
    expect(smtp.enviarCorreo).not.toHaveBeenCalled();
  });
});
