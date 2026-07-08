import { PartialType } from '@nestjs/swagger';
import { CreateBuilderDto } from './create-builder.dto';

export class UpdateBuilderDto extends PartialType(CreateBuilderDto) {}
