import { IsOptional, IsString } from 'class-validator'

export class RunThreadDto {
  @IsString()
  text: string

  @IsString()
  @IsOptional()
  threadId: string
}
