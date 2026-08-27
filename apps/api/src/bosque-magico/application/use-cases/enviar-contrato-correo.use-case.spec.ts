import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EtapaContrato } from '@prisma/client';
import { SmtpService } from '../../domain/services/smtp.service';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { EnviarContratoCorreoUseCase } from './enviar-contrato-correo.use-case';
import { MarcarContratoEnviadoUseCase } from './marcar-contrato-estado.use-case';

describe('EnviarContratoCorreoUseCase', () => {
  let useCase: EnviarContratoCorreoUseCase;
  let contratos: jest.Mocked<Pick<ContratosRepository, 'obtenerPorId'>>;
  let marcarEnviado: jest.Mocked<Pick<MarcarContratoEnviadoUseCase, 'ejecutar'>>;
  let smtp: jest.Mocked<Pick<SmtpService, 'estaActivo' | 'enviarCorreo'>>;
  let config: jest.Mocked<Pick<ConfigService, 'get'>>;

  const contrato = {
    id: 'c1',
    numero: 'CON-001',
    tokenPublico: 'tok123',
    etapa: EtapaContrato.borrador,
    snapshotJson: {
      cliente: { nombreCompleto: 'Ana Pérez', correo: '  ana@test.com  ' },
    },
  };

  beforeEach(() => {
    contratos = { obtenerPorId: jest.fn().mockResolvedValue(contrato) };
    marcarEnviado = {
      ejecutar: jest.fn().mockResolvedValue({ id: 'c1', etapa: 'enviado' }),
    };
    smtp = {
      estaActivo: jest.fn(),
      enviarCorreo: jest.fn().mockResolvedValue(undefined),
    };
    config = { get: jest.fn().mockReturnValue('https://bosquemagico.test') };
    useCase = new EnviarContratoCorreoUseCase(
      contratos as unknown as ContratosRepository,
      marcarEnviado as unknown as MarcarContratoEnviadoUseCase,
      smtp as unknown as SmtpService,
      config as unknown as ConfigService,
    );
  });

  it('envía por SMTP y marca enviado cuando SMTP está activo', async () => {
    smtp.estaActivo.mockResolvedValue(true);

    const res = await useCase.ejecutar('c1', {
      correoAsunto: 'Contrato CON-001',
      correoCuerpo: 'Hola Ana',
    });

    expect(res.enviadoPorSmtp).toBe(true);
    expect(res.correoDestino).toBe('ana@test.com');
    expect(smtp.enviarCorreo).toHaveBeenCalledWith({
      destino: 'ana@test.com',
      asunto: 'Contrato CON-001',
      texto: 'Hola Ana',
    });
    expect(marcarEnviado.ejecutar).toHaveBeenCalledWith('c1');
  });

  it('no abre SMTP y igual marca enviado cuando SMTP está inactivo', async () => {
    smtp.estaActivo.mockResolvedValue(false);

    const res = await useCase.ejecutar('c1', {
      correoAsunto: 'Asunto',
      correoCuerpo: 'Cuerpo',
    });

    expect(res.enviadoPorSmtp).toBe(false);
    expect(smtp.enviarCorreo).not.toHaveBeenCalled();
    expect(marcarEnviado.ejecutar).toHaveBeenCalledWith('c1');
  });

  it('rechaza si no hay correo', async () => {
    contratos.obtenerPorId.mockResolvedValue({
      ...contrato,
      snapshotJson: { cliente: { nombreCompleto: 'Ana' } },
    });

    await expect(useCase.ejecutar('c1', {})).rejects.toThrow(BadRequestException);
    expect(smtp.enviarCorreo).not.toHaveBeenCalled();
    expect(marcarEnviado.ejecutar).not.toHaveBeenCalled();
  });

  it('rechaza contrato inexistente', async () => {
    contratos.obtenerPorId.mockResolvedValue(null);

    await expect(useCase.ejecutar('x', {})).rejects.toThrow(NotFoundException);
  });
});
