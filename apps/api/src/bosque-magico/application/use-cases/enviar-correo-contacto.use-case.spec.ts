import { BadRequestException } from '@nestjs/common';
import { SmtpService } from '../../domain/services/smtp.service';
import { EnviarCorreoContactoUseCase } from './enviar-correo-contacto.use-case';

describe('EnviarCorreoContactoUseCase', () => {
  let useCase: EnviarCorreoContactoUseCase;
  let smtp: jest.Mocked<Pick<SmtpService, 'estaActivo' | 'enviarCorreo'>>;

  const dto = {
    correoDestino: '  ana@test.com  ',
    asunto: '  Hola  ',
    cuerpo: '  Mensaje  ',
  };

  beforeEach(() => {
    smtp = {
      estaActivo: jest.fn(),
      enviarCorreo: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new EnviarCorreoContactoUseCase(smtp as unknown as SmtpService);
  });

  it('envía por SMTP cuando está activo', async () => {
    smtp.estaActivo.mockResolvedValue(true);

    const res = await useCase.ejecutar(dto);

    expect(res.enviadoPorSmtp).toBe(true);
    expect(res.correoDestino).toBe('ana@test.com');
    expect(smtp.enviarCorreo).toHaveBeenCalledWith({
      destino: 'ana@test.com',
      asunto: 'Hola',
      texto: 'Mensaje',
      adjuntos: [],
    });
  });

  it('no envía y reporta mailto cuando SMTP está inactivo', async () => {
    smtp.estaActivo.mockResolvedValue(false);

    const res = await useCase.ejecutar(dto);

    expect(res).toEqual({
      enviadoPorSmtp: false,
      correoDestino: 'ana@test.com',
      correoAsunto: 'Hola',
      correoCuerpo: 'Mensaje',
    });
    expect(smtp.enviarCorreo).not.toHaveBeenCalled();
  });

  it('adjunta archivos cuando SMTP está activo', async () => {
    smtp.estaActivo.mockResolvedValue(true);
    const buffer = Buffer.from('pdf');

    await useCase.ejecutar(dto, [
      {
        originalname: 'carta.pdf',
        mimetype: 'application/pdf',
        size: 3,
        buffer,
      },
    ]);

    expect(smtp.enviarCorreo).toHaveBeenCalledWith(
      expect.objectContaining({
        adjuntos: [
          {
            filename: 'carta.pdf',
            content: buffer,
            contentType: 'application/pdf',
          },
        ],
      }),
    );
  });

  it('rechaza más de 5 adjuntos', async () => {
    smtp.estaActivo.mockResolvedValue(true);
    const files = Array.from({ length: 6 }, (_, i) => ({
      originalname: `f${i}.txt`,
      mimetype: 'text/plain',
      size: 1,
      buffer: Buffer.from('x'),
    }));

    await expect(useCase.ejecutar(dto, files)).rejects.toThrow(BadRequestException);
    expect(smtp.enviarCorreo).not.toHaveBeenCalled();
  });
});
