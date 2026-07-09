import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Cria uma nova empresa (tenant) e o usuário administrador',
  })
  @ApiResponse({ status: 201, description: 'Conta criada com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica um usuário e retorna access token + refresh token',
  })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Troca um refresh token válido por um novo par de tokens (rotação)',
  })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido, expirado ou revogado',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoga o refresh token, encerrando a sessão' })
  @ApiResponse({ status: 204, description: 'Sessão encerrada' })
  logout(@Body() dto: RefreshTokenDto, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(dto.refreshToken, user.userId);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Revoga todos os refresh tokens do usuário, encerrando a sessão em todos os dispositivos',
  })
  @ApiResponse({ status: 204, description: 'Todas as sessões encerradas' })
  logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logoutAll(user.userId);
  }
}
