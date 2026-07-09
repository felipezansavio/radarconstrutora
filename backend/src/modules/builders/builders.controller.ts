import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { BuildersService } from './builders.service';
import { CreateBuilderDto } from './dto/create-builder.dto';
import { QueryBuildersDto } from './dto/query-builders.dto';
import { UpdateBuilderDto } from './dto/update-builder.dto';

@ApiTags('builders')
@ApiBearerAuth()
@Controller('builders')
export class BuildersController {
  constructor(private readonly buildersService: BuildersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista construtoras com filtros e paginação' })
  findAll(@Query() query: QueryBuildersDto) {
    return this.buildersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma construtora pelo id' })
  findOne(@Param('id') id: string) {
    return this.buildersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Cadastra uma nova construtora' })
  create(@Body() dto: CreateBuilderDto) {
    return this.buildersService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GESTOR')
  @ApiOperation({ summary: 'Atualiza os dados de uma construtora' })
  update(@Param('id') id: string, @Body() dto: UpdateBuilderDto) {
    return this.buildersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma construtora' })
  remove(@Param('id') id: string) {
    return this.buildersService.remove(id);
  }
}
