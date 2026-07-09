import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants/security.constants';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';

export interface RequestMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Já existe uma conta com este e-mail');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: dto.companyName },
      });

      return tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });
    });

    return this.issueTokens(user);
  }

  async login(
    dto: LoginDto,
    metadata: RequestMetadata = {},
  ): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const isActive = Boolean(user) && !user!.deletedAt;
    const isPasswordValid =
      user && isActive
        ? await bcrypt.compare(dto.password, user.passwordHash)
        : false;

    if (!user || !isActive || !isPasswordValid) {
      await this.auditService.record({
        tenantId: user?.tenantId,
        userId: isActive ? user?.id : undefined,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user?.id,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    await this.auditService.record({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return this.issueTokens(user);
  }

  /**
   * Troca um refresh token válido por um novo par de tokens (rotação:
   * o token usado é revogado e um novo é emitido). Se o token apresentado
   * já tiver sido revogado antes, tratamos como possível roubo de sessão
   * (reuso de token) e revogamos todas as sessões do usuário.
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const stored = await this.refreshTokensRepository.findByHash(
      this.hashToken(refreshToken),
    );

    if (stored?.revokedAt) {
      this.logger.warn(
        `Reuso de refresh token detectado para o usuário ${stored.userId} — revogando todas as sessões`,
      );
      await this.refreshTokensRepository.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    if (
      !stored ||
      stored.expiresAt.getTime() < Date.now() ||
      stored.userId !== payload.sub
    ) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    await this.refreshTokensRepository.revoke(stored.id);

    return this.issueTokens(user);
  }

  /**
   * Revoga um refresh token, encerrando a sessão associada a ele.
   */
  async logout(refreshToken: string, currentUserId: string): Promise<void> {
    const stored = await this.refreshTokensRepository.findByHash(
      this.hashToken(refreshToken),
    );

    if (!stored) {
      return;
    }

    if (stored.userId !== currentUserId) {
      throw new ForbiddenException(
        'Você não tem permissão para encerrar esta sessão',
      );
    }

    if (!stored.revokedAt) {
      await this.refreshTokensRepository.revoke(stored.id);
    }

    await this.auditService.record({
      userId: currentUserId,
      action: 'LOGOUT',
      entity: 'User',
      entityId: currentUserId,
    });
  }

  /**
   * Revoga todos os refresh tokens do usuário — encerra a sessão em
   * todos os dispositivos (ex.: suspeita de token comprometido).
   */
  async logoutAll(currentUserId: string): Promise<void> {
    await this.refreshTokensRepository.revokeAllForUser(currentUserId);

    await this.auditService.record({
      userId: currentUserId,
      action: 'LOGOUT_ALL',
      entity: 'User',
      entityId: currentUserId,
    });
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ sub: string; email: string; tenantId: string }> {
    try {
      return await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(user: AuthUser | User): Promise<AuthResult> {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshTtl = this.configService.get<string>('jwt.refreshTokenTtl')!;
    const refreshToken = this.jwtService.sign(
      // jti garante um token único mesmo quando dois logins/refreshes do
      // mesmo usuário acontecem no mesmo segundo (sem isso, o payload e o
      // "iat" seriam idênticos e o hash colidiria com a constraint única).
      { ...payload, jti: randomUUID() },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const decoded = this.jwtService.decode<{ exp: number }>(refreshToken);

    await this.refreshTokensRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
