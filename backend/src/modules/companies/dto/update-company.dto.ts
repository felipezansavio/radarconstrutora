import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

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
}
