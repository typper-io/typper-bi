import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateThreadDto {
  @IsNotEmpty()
  @IsString()
  title: string
}
