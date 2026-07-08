import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsUuidLike } from '../../../common/validators/is-uuid-like.decorator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Visitar canteiro de obras' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ enum: TaskType, default: 'FOLLOW_UP' })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiProperty({ example: '2026-07-15T14:00:00.000Z' })
  @IsDateString()
  dueAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000301' })
  @IsOptional()
  @IsUuidLike()
  leadId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000003' })
  @IsOptional()
  @IsUuidLike()
  assigneeId?: string;
}
