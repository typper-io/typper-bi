import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class SignInOrSignUpDto {
  @IsString()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  avatar: string

  @IsString()
  @IsNotEmpty()
  name: string
}
