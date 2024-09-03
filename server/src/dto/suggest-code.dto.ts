import { Engines } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'

export class SuggestCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsEnum(Engines)
  language: Engines
}
