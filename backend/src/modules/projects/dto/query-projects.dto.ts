import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConstructionStatus,
  DevelopmentStandard,
  PropertyType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IsUuidLike } from '../../../common/validators/is-uuid-like.decorator';

export class QueryProjectsDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000101' })
  @IsOptional()
  @IsUuidLike()
  companyId?: string;

  @ApiPropertyOptional({ enum: ConstructionStatus })
  @IsOptional()
  @IsEnum(ConstructionStatus)
  status?: ConstructionStatus;

  @ApiPropertyOptional({ enum: DevelopmentStandard })
  @IsOptional()
  @IsEnum(DevelopmentStandard)
  standard?: DevelopmentStandard;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
