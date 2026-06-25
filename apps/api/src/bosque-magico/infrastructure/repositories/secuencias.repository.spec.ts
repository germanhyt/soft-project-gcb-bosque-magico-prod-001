import { SecuenciasRepository } from './secuencias.repository';

describe('SecuenciasRepository', () => {
  it('formatea el código con prefijo y padding', async () => {
    const tx = {
      bosqueMagicoSecuencia: {
        findUnique: jest.fn().mockResolvedValue({ prefijo: 'COT-', ultimo: 41, padding: 5 }),
        update: jest.fn().mockResolvedValue({ prefijo: 'COT-', ultimo: 42, padding: 5 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const repo = new SecuenciasRepository(prisma as never);
    await expect(repo.siguiente('COT-')).resolves.toBe('COT-00042');
  });

  it('crea la secuencia si no existe', async () => {
    const tx = {
      bosqueMagicoSecuencia: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ prefijo: 'BM-CT-', ultimo: 1, padding: 5 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const repo = new SecuenciasRepository(prisma as never);
    await expect(repo.siguiente('BM-CT-')).resolves.toBe('BM-CT-00001');
  });
});
