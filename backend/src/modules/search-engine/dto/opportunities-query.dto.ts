import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConstructionStatus,
  DevelopmentStandard,
  PropertyType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

export class OpportunitiesQueryDto {
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
}
