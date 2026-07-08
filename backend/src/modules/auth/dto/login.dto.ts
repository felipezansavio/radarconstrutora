import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana@esquadriasilva.com.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte123!' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password!: string;
}
