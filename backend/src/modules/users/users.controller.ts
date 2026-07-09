import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Lista os usuários da empresa do usuário logado' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAllForTenant(user.tenantId);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Cadastra um novo usuário na empresa (somente admin)',
  })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(dto, user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado' })
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findOneForTenant(user.userId, user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Busca um usuário da empresa por id' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findOneForTenant(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza nome/perfil de um usuário' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove um usuário da empresa (somente admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.remove(id, user);
  }
}
