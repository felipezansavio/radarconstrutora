import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: configService.get<string>('database.url'),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conexão com o banco de dados estabelecida');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
