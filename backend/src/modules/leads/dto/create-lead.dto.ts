import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadTemperature } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateLeadDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000101' })
  @ValidateIf((dto: CreateLeadDto) => !dto.developmentId)
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000201' })
  @IsOptional()
  @IsUUID()
  developmentId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000003' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: LeadTemperature, default: 'WARM' })
  @IsOptional()
  @IsEnum(LeadTemperature)
  temperature?: LeadTemperature;

  @ApiPropertyOptional({
    example: 'Lead gerado a partir do radar de oportunidades.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
