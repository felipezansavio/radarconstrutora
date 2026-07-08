import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConstructionStatus,
  DevelopmentStandard,
  PropertyType,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { IsUuidLike } from '../../../common/validators/is-uuid-like.decorator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Edifício Horizonte Ipiranga' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000101' })
  @IsUuidLike()
  companyId!: string;

  @ApiPropertyOptional({ enum: ConstructionStatus })
  @IsOptional()
  @IsEnum(ConstructionStatus)
  status?: ConstructionStatus;

  @ApiPropertyOptional({ enum: DevelopmentStandard })
  @IsOptional()
  @IsEnum(DevelopmentStandard)
  standard?: DevelopmentStandard;

  @ApiPropertyOptional({ enum: PropertyType, default: 'RESIDENTIAL' })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  unitsCount?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  floorsCount?: number;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2029-06-30' })
  @IsOptional()
  @IsDateString()
  deliveryForecast?: string;

  @ApiPropertyOptional({ example: 'Rua Fictícia, 100' })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional({ example: 'Pinheiros' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '05422-000' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: -23.5629 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: -46.6825 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
