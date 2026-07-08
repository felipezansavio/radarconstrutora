import { Injectable, NestMiddleware, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';

const WINDOW_SECONDS = 15 * 60;
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Protege POST /auth/login contra força bruta: conta tentativas
 * malsucedidas (401) por IP + e-mail em uma janela deslizante e bloqueia
 * temporariamente quando o limite é excedido. Complementa o RolesGuard/
 * JwtAuthGuard (autorização) atuando antes do roteamento, e usa Redis para
 * que o limite seja compartilhado entre múltiplas instâncias da API.
 */
@Injectable()
export class LoginThrottleMiddleware
  implements NestMiddleware, OnModuleDestroy
{
  private readonly redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis({
      host: configService.get<string>('redis.host'),
      port: configService.get<number>('redis.port'),
      password: configService.get<string>('redis.password'),
      lazyConnect: true,
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const body = req.body as { email?: unknown } | undefined;
    const email =
      typeof body?.email === 'string' ? body.email.toLowerCase() : '';
    const key = `login-throttle:${req.ip}:${email}`;

    let attempts = 0;
    try {
      attempts = Number((await this.redis.get(key)) ?? 0);
    } catch {
      // Redis indisponível: não bloqueia o login por causa disso.
      return next();
    }

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      res.status(429).json({
        statusCode: 429,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        message:
          'Muitas tentativas de login malsucedidas. Tente novamente em alguns minutos.',
      });
      return;
    }

    res.on('finish', () => {
      if (res.statusCode === 401) {
        void this.redis
          .multi()
          .incr(key)
          .expire(key, WINDOW_SECONDS)
          .exec()
          .catch(() => undefined);
      }
    });

    next();
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
