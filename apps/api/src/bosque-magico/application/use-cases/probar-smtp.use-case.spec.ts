import { BadRequestException } from '@nestjs/common';
import { SmtpService } from '../../domain/services/smtp.service';
import { ProbarSmtpUseCase } from './probar-smtp.use-case';

describe('ProbarSmtpUseCase', () => {
  let useCase: ProbarSmtpUseCase;
  let smtp: jest.Mocked<Pick<SmtpService, 'enviarCorreo'>>;

  beforeEach(() => {
    smtp = { enviarCorreo: jest.fn().mockResolvedValue(undefined) };
    useCase = new ProbarSmtpUseCase(smtp as unknown as SmtpService);
  });

  it('envía un correo de prueba al destino indicado', async () => {
    const res = await useCase.ejecutar({
      correoDestino: '  operador@ejemplo.com  ',
    });

    expect(res).toEqual({ ok: true, destino: 'operador@ejemplo.com' });
    expect(smtp.enviarCorreo).toHaveBeenCalledWith({
      destino: 'operador@ejemplo.com',
      asunto: 'Prueba SMTP — Bosque Mágico',
      texto: expect.stringContaining('correo de prueba'),
    });
  });

  it('propaga el error si SMTP no está habilitado', async () => {
    smtp.enviarCorreo.mockRejectedValue(
      new BadRequestException('El envío SMTP no está habilitado'),
    );

    await expect(
      useCase.ejecutar({ correoDestino: 'operador@ejemplo.com' }),
    ).rejects.toThrow(BadRequestException);
  });
});
