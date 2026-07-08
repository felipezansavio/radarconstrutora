import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';

const SALT_ROUNDS = 10;

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Já existe uma conta com este e-mail');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

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

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const isPasswordValid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.issueTokens(user);
  }

  /**
   * Troca um refresh token válido por um novo par de tokens (rotação:
   * o token usado é revogado e um novo é emitido).
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const stored = await this.refreshTokensRepository.findByHash(
      this.hashToken(refreshToken),
    );

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now() ||
      stored.userId !== payload.sub
    ) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
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

  private async issueTokens(user: AuthUser): Promise<AuthResult> {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshTtl = this.configService.get<string>('jwt.refreshTokenTtl')!;
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: refreshTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

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
