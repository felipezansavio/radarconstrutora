import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, Max, Min } from 'class-validator';

export class DiscoverQueryDto {
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
}
