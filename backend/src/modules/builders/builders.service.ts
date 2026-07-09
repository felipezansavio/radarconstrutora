import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildPaginatedResult } from '../../common/dto/paginated-result.dto';
import { CreateBuilderDto } from './dto/create-builder.dto';
import { QueryBuildersDto } from './dto/query-builders.dto';
import { UpdateBuilderDto } from './dto/update-builder.dto';
import { BuildersRepository } from './repositories/builders.repository';

@Injectable()
export class BuildersService {
  constructor(private readonly buildersRepository: BuildersRepository) {}

  async findAll(query: QueryBuildersDto) {
    const { page, pageSize, city, state, name } = query;

    const { data, total } = await this.buildersRepository.findMany({
      city,
      state,
      name,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return buildPaginatedResult(data, total, page, pageSize);
  }

  async findOne(id: string) {
    const builder = await this.buildersRepository.findById(id);

    if (!builder) {
      throw new NotFoundException('Construtora não encontrada');
    }

    return builder;
  }

  async create(dto: CreateBuilderDto) {
    if (dto.cnpj) {
      const existing = await this.buildersRepository.findByCnpj(dto.cnpj);
      if (existing) {
        throw new ConflictException('Já existe uma construtora com este CNPJ');
      }
    }

    return this.buildersRepository.create(dto);
  }

  async update(id: string, dto: UpdateBuilderDto) {
    await this.findOne(id);

    if (dto.cnpj) {
      const existing = await this.buildersRepository.findByCnpj(dto.cnpj);
      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe uma construtora com este CNPJ');
      }
    }

    return this.buildersRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.buildersRepository.softDelete(id);
  }
}
