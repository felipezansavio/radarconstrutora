import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Esquadrias Silva' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Esquadrias de alumínio e vidro' })
  @IsOptional()
  @IsString()
  segment?: string;

  @ApiPropertyOptional({ example: 'contato@esquadriasilva.com.br' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+55 11 4000-1000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://esquadriasilva.com.br' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description:
      'Ativa o monitoramento automático diário de novas oportunidades (Parte 11)',
  })
  @IsOptional()
  @IsBoolean()
  alertsEnabled?: boolean;

  @ApiPropertyOptional({
    example: -23.5613,
    description:
      'Latitude da sua empresa, usada como ponto de referência do monitoramento automático',
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  monitoringLatitude?: number;

  @ApiPropertyOptional({ example: -46.6565 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  monitoringLongitude?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Raio de monitoramento em quilômetros',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(200)
  monitoringRadiusKm?: number;

  @ApiPropertyOptional({
    example: '+55 11 90000-0000',
    description: 'Número de WhatsApp para receber alertas (integração futura)',
  })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}
