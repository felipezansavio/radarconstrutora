import { Injectable, NotFoundException } from '@nestjs/common';
import { buildPaginatedResult } from '../../common/dto/paginated-result.dto';
import { BuildersRepository } from '../builders/repositories/builders.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsRepository } from './repositories/projects.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly buildersRepository: BuildersRepository,
  ) {}

  async findAll(query: QueryProjectsDto) {
    const { page, pageSize, ...filters } = query;

    const { data, total } = await this.projectsRepository.findMany({
      ...filters,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return buildPaginatedResult(data, total, page, pageSize);
  }

  async findOne(id: string) {
    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException('Empreendimento não encontrado');
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    const builder = await this.buildersRepository.findById(dto.companyId);

    if (!builder) {
      throw new NotFoundException('Construtora não encontrada');
    }

    const { companyId, startDate, deliveryForecast, ...rest } = dto;

    return this.projectsRepository.create({
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      deliveryForecast: deliveryForecast
        ? new Date(deliveryForecast)
        : undefined,
      company: { connect: { id: companyId } },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    if (dto.companyId) {
      const builder = await this.buildersRepository.findById(dto.companyId);
      if (!builder) {
        throw new NotFoundException('Construtora não encontrada');
      }
    }

    const { companyId, startDate, deliveryForecast, ...rest } = dto;

    return this.projectsRepository.update(id, {
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      deliveryForecast: deliveryForecast
        ? new Date(deliveryForecast)
        : undefined,
      company: companyId ? { connect: { id: companyId } } : undefined,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.projectsRepository.delete(id);
  }
}
