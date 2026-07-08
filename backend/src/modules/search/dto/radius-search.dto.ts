import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConstructionStatus,
  DevelopmentStandard,
  PropertyType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

export type SearchTarget = 'builders' | 'projects' | 'all';

export class RadiusSearchDto {
  @ApiProperty({ example: -23.5613 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: -46.6565 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiProperty({ example: 10, description: 'Raio de busca em quilômetros' })
  @Type(() => Number)
  @Min(0.1)
  @Max(200)
  radiusKm!: number;

  @ApiPropertyOptional({
    enum: ['builders', 'projects', 'all'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['builders', 'projects', 'all'])
  type: SearchTarget = 'all';

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

  @ApiPropertyOptional({
    example: 5,
    description: 'Número mínimo de pavimentos',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  minFloors?: number;

  @ApiPropertyOptional({
    example: 70,
    description: 'Nota mínima de potencial comercial (0-100) dada pela IA',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minScore?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Nota máxima de potencial comercial (0-100) dada pela IA',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxScore?: number;
}
