import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function buildContext(role: string): ExecutionContext {
  return {
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('permite qualquer perfil autenticado quando a rota não declara @Roles()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(buildContext('VENDEDOR'))).toBe(true);
  });

  it('bloqueia um perfil fora da lista exigida pela rota', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(buildContext('VENDEDOR'))).toThrow(
      ForbiddenException,
    );
  });

  it('libera um perfil presente na lista exigida pela rota', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['ADMIN', 'GESTOR']);

    expect(guard.canActivate(buildContext('GESTOR'))).toBe(true);
  });

  it('bloqueia o vendedor de uma rota restrita a admin (remoção de usuário)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(buildContext('VENDEDOR'))).toThrow(
      'Você não tem permissão para executar esta ação',
    );
  });
});
