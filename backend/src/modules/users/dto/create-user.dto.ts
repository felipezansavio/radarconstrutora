import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';
import { MAX_PASSWORD_LENGTH } from '../../../common/constants/security.constants';

export class CreateUserDto {
  @ApiProperty({ example: 'Carla Vendas' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name!: string;

  @ApiProperty({ example: 'carla@esquadriasilva.com.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte123!' })
  @MaxLength(MAX_PASSWORD_LENGTH, {
    message: `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres`,
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    },
    {
      message:
        'A senha deve ter ao menos 8 caracteres, incluindo letra maiúscula, minúscula e número',
    },
  )
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, default: 'VENDEDOR' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
