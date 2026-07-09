import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { RefreshTokensRepository } from '../auth/repositories/refresh-tokens.repository';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants/security.constants';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAllForTenant(tenantId: string): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findManyByTenant(tenantId);
    return users.map((user) => UserResponseDto.fromEntity(user));
  }

  /**
   * Cadastra um novo usuário dentro da empresa do administrador logado.
   */
  async create(
    dto: CreateUserDto,
    currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? 'VENDEDOR',
      tenant: { connect: { id: currentUser.tenantId } },
    });

    await this.auditService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValue: { name: user.name, email: user.email, role: user.role },
    });

    return UserResponseDto.fromEntity(user);
  }

  async findOneForTenant(
    id: string,
    tenantId: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);

    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return UserResponseDto.fromEntity(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const target = await this.usersRepository.findById(id);

    if (!target || target.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isSelf = target.id === currentUser.userId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este usuário',
      );
    }

    if (dto.role && !isAdmin) {
      throw new ForbiddenException(
        'Apenas administradores podem alterar o perfil de um usuário',
      );
    }

    const updated = await this.usersRepository.update(id, {
      name: dto.name,
      role: dto.role,
    });

    if (dto.role && dto.role !== target.role) {
      await this.auditService.record({
        tenantId: currentUser.tenantId,
        userId: currentUser.userId,
        action: 'USER_ROLE_CHANGED',
        entity: 'User',
        entityId: id,
        oldValue: { role: target.role },
        newValue: { role: dto.role },
      });

      // Perfis alterados forçam um novo login em todas as sessões ativas.
      await this.refreshTokensRepository.revokeAllForUser(id);
    }

    return UserResponseDto.fromEntity(updated);
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const target = await this.usersRepository.findById(id);

    if (!target || target.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (target.id === currentUser.userId) {
      throw new ForbiddenException('Você não pode remover sua própria conta');
    }

    await this.usersRepository.softDelete(id);
    await this.refreshTokensRepository.revokeAllForUser(id);

    await this.auditService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      action: 'USER_DELETED',
      entity: 'User',
      entityId: id,
      oldValue: { name: target.name, email: target.email, role: target.role },
    });
  }
}
