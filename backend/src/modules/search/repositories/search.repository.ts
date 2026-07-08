import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  logSearch(data: Prisma.SearchCreateInput) {
    return this.prisma.search.create({ data });
  }
}
