import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { TasksService } from './tasks.service';

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

describe('TasksService — isolamento por dono e por empresa', () => {
  let service: TasksService;
  let tasksRepository: {
    findMany: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let usersRepository: { findById: jest.Mock };
  let auditService: { record: jest.Mock };

  const taskAssignedToSelf = {
    id: 'task-1',
    tenantId: 'tenant-1',
    assigneeId: 'user-1',
    title: 'Ligar para o lead',
    completedAt: null,
  };

  const taskAssignedToOther = {
    ...taskAssignedToSelf,
    id: 'task-2',
    assigneeId: 'other-user',
  };

  const taskFromOtherTenant = {
    ...taskAssignedToSelf,
    id: 'task-3',
    tenantId: 'tenant-2',
  };

  beforeEach(() => {
    tasksRepository = {
      findMany: jest.fn().mockReturnValue([]),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    usersRepository = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' }),
    };
    auditService = { record: jest.fn() };

    service = new TasksService(
      tasksRepository as never,
      {} as never,
      usersRepository as never,
      auditService as never,
    );
  });

  describe('findAll', () => {
    it('força o filtro por responsável quando o perfil é VENDEDOR', async () => {
      await service.findAll(
        { assigneeId: 'other-user' },
        buildUser({ role: 'VENDEDOR' }),
      );

      expect(tasksRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeId: 'user-1' }),
      );
    });

    it('respeita o assigneeId pedido quando o perfil é GESTOR', async () => {
      await service.findAll(
        { assigneeId: 'other-user' },
        buildUser({ role: 'GESTOR' }),
      );

      expect(tasksRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeId: 'other-user' }),
      );
    });
  });

  describe('findOne', () => {
    it('bloqueia um vendedor de acessar tarefa atribuída a outro vendedor', async () => {
      tasksRepository.findById.mockResolvedValue(taskAssignedToOther);

      await expect(
        service.findOne('task-2', buildUser({ role: 'VENDEDOR' })),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite que um admin acesse tarefa de qualquer vendedor', async () => {
      tasksRepository.findById.mockResolvedValue(taskAssignedToOther);

      await expect(
        service.findOne('task-2', buildUser({ role: 'ADMIN' })),
      ).resolves.toEqual(taskAssignedToOther);
    });

    it('nunca revela tarefa de outra empresa (isolamento de tenant)', async () => {
      tasksRepository.findById.mockResolvedValue(taskFromOtherTenant);

      await expect(
        service.findOne('task-3', buildUser({ role: 'ADMIN' })),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('impede um vendedor de criar tarefa atribuída a outra pessoa', async () => {
      await expect(
        service.create(
          {
            assigneeId: 'other-user',
            title: 'x',
            dueAt: '2026-01-01',
          },
          buildUser({ role: 'VENDEDOR' }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('impede um vendedor de reatribuir a própria tarefa a outra pessoa', async () => {
      tasksRepository.findById.mockResolvedValue(taskAssignedToSelf);

      await expect(
        service.update(
          'task-1',
          { assigneeId: 'other-user' },
          buildUser({ role: 'VENDEDOR' }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite que um gestor reatribua uma tarefa', async () => {
      tasksRepository.findById.mockResolvedValue(taskAssignedToSelf);
      tasksRepository.update.mockResolvedValue({
        ...taskAssignedToSelf,
        assigneeId: 'other-user',
      });

      await expect(
        service.update(
          'task-1',
          { assigneeId: 'other-user' },
          buildUser({ role: 'GESTOR' }),
        ),
      ).resolves.toBeDefined();
    });
  });
});
