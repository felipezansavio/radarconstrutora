import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

function buildService() {
  const prisma = {
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1' }),
    decode: jest
      .fn()
      .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  };
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'jwt.refreshSecret': 'refresh-secret',
        'jwt.refreshTokenTtl': '7d',
      };
      return values[key];
    }),
  };
  const refreshTokensRepository = {
    create: jest.fn().mockResolvedValue(undefined),
    findByHash: jest.fn(),
    revoke: jest.fn().mockResolvedValue(undefined),
    revokeAllForUser: jest.fn().mockResolvedValue(undefined),
  };
  const auditService = { record: jest.fn() };

  const service = new AuthService(
    prisma as never,
    jwtService as never,
    configService as never,
    refreshTokensRepository as never,
    auditService as never,
  );

  return { service, prisma, jwtService, refreshTokensRepository, auditService };
}

describe('AuthService', () => {
  describe('login', () => {
    it('rejeita credenciais de uma conta removida (soft delete), mesmo com a senha correta', async () => {
      const { service, prisma, auditService } = buildService();
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-1',
        passwordHash: 'hashed',
        deletedAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'x@x.com', password: 'Senha123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_FAILED' }),
      );
    });

    it('rejeita senha incorreta e registra a tentativa na auditoria', async () => {
      const { service, prisma, auditService } = buildService();
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-1',
        passwordHash: 'hashed',
        deletedAt: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'x@x.com', password: 'senha-errada' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_FAILED' }),
      );
    });

    it('autentica e registra o login na auditoria quando as credenciais são válidas', async () => {
      const { service, prisma, auditService } = buildService();
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Ana',
        email: 'ana@empresa.com',
        role: 'ADMIN',
        tenantId: 'tenant-1',
        passwordHash: 'hashed',
        deletedAt: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'ana@empresa.com',
        password: 'Senha123',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN', userId: 'user-1' }),
      );
    });
  });

  describe('refresh — proteção contra roubo de sessão', () => {
    it('revoga todas as sessões do usuário ao detectar reuso de um refresh token já usado', async () => {
      const { service, refreshTokensRepository } = buildService();
      refreshTokensRepository.findByHash.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      await expect(service.refresh('some-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(refreshTokensRepository.revokeAllForUser).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('rejeita um refresh token expirado sem derrubar as demais sessões', async () => {
      const { service, refreshTokensRepository } = buildService();
      refreshTokensRepository.findByHash.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('some-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(refreshTokensRepository.revokeAllForUser).not.toHaveBeenCalled();
    });
  });
});
