import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export type ApproachChannel = 'WHATSAPP' | 'EMAIL' | 'CALL';

export class GenerateApproachDto {
  @ApiProperty({ enum: ['WHATSAPP', 'EMAIL', 'CALL'] })
  @IsIn(['WHATSAPP', 'EMAIL', 'CALL'])
  channel!: ApproachChannel;
}
