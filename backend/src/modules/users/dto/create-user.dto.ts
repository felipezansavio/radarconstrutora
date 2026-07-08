import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Carla Vendas' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name!: string;

  @ApiProperty({ example: 'carla@esquadriasilva.com.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte123!' })
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres' })
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, default: 'VENDEDOR' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
