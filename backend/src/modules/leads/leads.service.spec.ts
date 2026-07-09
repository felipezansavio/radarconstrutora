import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { LeadsService } from './leads.service';

function buildUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    userId: 'user-1',
    email: 'vendedor@empresa.com',
    tenantId: 'tenant-1',
    role: 'VENDEDOR',
    ...overrides,
  };
}

describe('LeadsService — isolamento por dono e por empresa', () => {
  let service: LeadsService;
  let leadsRepository: {
    findMany: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let usersRepository: { findById: jest.Mock };
  let notificationsService: { notify: jest.Mock };
  let auditService: { record: jest.Mock };

  const leadOwnedBySelf = {
    id: 'lead-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    commercialStatus: 'NEW',
    company: null,
    development: null,
  };

  const leadOwnedByOther = {
    ...leadOwnedBySelf,
    id: 'lead-2',
    ownerId: 'other-user',
  };

  const leadFromOtherTenant = {
    ...leadOwnedBySelf,
    id: 'lead-3',
    tenantId: 'tenant-2',
  };

  beforeEach(() => {
    leadsRepository = {
      findMany: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    usersRepository = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' }),
    };
    notificationsService = { notify: jest.fn() };
    auditService = { record: jest.fn() };

    service = new LeadsService(
      leadsRepository as never,
      {} as never,
      {} as never,
      usersRepository as never,
      notificationsService as never,
      auditService as never,
    );
  });

  describe('findAll', () => {
    it('força o filtro por dono quando o perfil é VENDEDOR, mesmo que outro ownerId seja pedido', async () => {
      await service.findAll(
        { ownerId: 'other-user', page: 1, pageSize: 20 },
        buildUser({ role: 'VENDEDOR' }),
      );

      expect(leadsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-1' }),
      );
    });

    it('respeita o ownerId pedido quando o perfil é GESTOR ou ADMIN', async () => {
      await service.findAll(
        { ownerId: 'other-user', page: 1, pageSize: 20 },
        buildUser({ role: 'GESTOR' }),
      );

      expect(leadsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'other-user' }),
      );
    });
  });

  describe('findOne', () => {
    it('bloqueia um vendedor de acessar lead de outro vendedor na mesma empresa', async () => {
      leadsRepository.findById.mockResolvedValue(leadOwnedByOther);

      await expect(
        service.findOne('lead-2', buildUser({ role: 'VENDEDOR' })),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite que um gestor acesse lead de qualquer vendedor da empresa', async () => {
      leadsRepository.findById.mockResolvedValue(leadOwnedByOther);

      await expect(
        service.findOne('lead-2', buildUser({ role: 'GESTOR' })),
      ).resolves.toEqual(leadOwnedByOther);
    });

    it('nunca revela lead de outra empresa, mesmo para admin (isolamento de tenant)', async () => {
      leadsRepository.findById.mockResolvedValue(leadFromOtherTenant);

      await expect(
        service.findOne('lead-3', buildUser({ role: 'ADMIN' })),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('impede um vendedor de criar lead atribuído a outra pessoa', async () => {
      await expect(
        service.create(
          { ownerId: 'other-user' },
          buildUser({ role: 'VENDEDOR' }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite que um gestor crie lead atribuído a outra pessoa', async () => {
      leadsRepository.create.mockResolvedValue({
        id: 'lead-new',
        commercialStatus: 'NEW',
      });

      await expect(
        service.create(
          { ownerId: 'other-user' },
          buildUser({ role: 'GESTOR' }),
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('update', () => {
    it('impede um vendedor de reatribuir o dono de um lead próprio', async () => {
      leadsRepository.findById.mockResolvedValue(leadOwnedBySelf);

      await expect(
        service.update(
          'lead-1',
          { ownerId: 'other-user' },
          buildUser({ role: 'VENDEDOR' }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite que um admin reatribua o dono de um lead', async () => {
      leadsRepository.findById.mockResolvedValue(leadOwnedBySelf);
      leadsRepository.update.mockResolvedValue({
        ...leadOwnedBySelf,
        ownerId: 'other-user',
      });

      await expect(
        service.update(
          'lead-1',
          { ownerId: 'other-user' },
          buildUser({ role: 'ADMIN' }),
        ),
      ).resolves.toBeDefined();
    });
  });
});
