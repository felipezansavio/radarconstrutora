import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';
import { MAX_PASSWORD_LENGTH } from '../../../common/constants/security.constants';

export class RegisterDto {
  @ApiProperty({ example: 'Ana Diretoria' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name!: string;

  @ApiProperty({ example: 'ana@esquadriasilva.com.br' })
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

  @ApiProperty({ example: 'Esquadrias Silva' })
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório' })
  companyName!: string;
}
