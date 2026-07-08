import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class NearbySearchDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(200)
  radiusKm!: number;
}
