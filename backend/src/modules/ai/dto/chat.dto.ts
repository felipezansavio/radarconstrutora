import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IsUuidLike } from '../../../common/validators/is-uuid-like.decorator';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class ChatDto {
  @ApiProperty({ example: 'Quais leads têm maior potencial essa semana?' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    description: 'Construtora em foco, para respostas mais direcionadas',
  })
  @IsOptional()
  @IsUuidLike()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Lead em foco, para respostas mais direcionadas',
  })
  @IsOptional()
  @IsUuidLike()
  leadId?: string;

  @ApiPropertyOptional({
    description: 'Últimas mensagens da conversa, para dar continuidade',
    type: [ChatMessageDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}
