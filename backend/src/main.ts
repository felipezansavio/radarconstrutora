import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

function swaggerBasicAuth(user: string, password: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (header?.startsWith('Basic ')) {
      const [providedUser, providedPassword] = Buffer.from(
        header.slice('Basic '.length),
        'base64',
      )
        .toString('utf8')
        .split(':');

      if (providedUser === user && providedPassword === password) {
        return next();
      }
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="docs"');
    res
      .status(401)
      .send('Autenticação necessária para acessar a documentação da API');
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.use(helmet());

  const apiPrefix = process.env.API_PREFIX ?? 'api';
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const docsPath = `${apiPrefix}/docs`;
  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;
  const isProduction = process.env.NODE_ENV === 'production';

  // Fora de produção, os docs ficam sempre acessíveis (conveniência de
  // desenvolvimento). Em produção, só ficam expostos se houver credenciais
  // configuradas — do contrário a rota nem é montada.
  if (!isProduction || (swaggerUser && swaggerPassword)) {
    if (swaggerUser && swaggerPassword) {
      app.use(`/${docsPath}`, swaggerBasicAuth(swaggerUser, swaggerPassword));
    }

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Radar Construtora IA API')
      .setDescription(
        'API da plataforma SaaS Radar Construtora IA para identificação de oportunidades comerciais em construtoras.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(docsPath, app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

void bootstrap();
