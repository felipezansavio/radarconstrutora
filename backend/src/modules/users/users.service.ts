import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAllForTenant(tenantId: string): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findManyByTenant(tenantId);
    return users.map((user) => UserResponseDto.fromEntity(user));
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

    await this.usersRepository.delete(id);
  }
}
