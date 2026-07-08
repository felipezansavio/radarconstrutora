import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ana Diretoria' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name!: string;

  @ApiProperty({ example: 'ana@esquadriasilva.com.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte123!' })
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres' })
  password!: string;

  @ApiProperty({ example: 'Esquadrias Silva' })
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório' })
  companyName!: string;
}
