import { IsArray, IsNotEmpty, IsString } from 'class-validator'

export class AddContextDataSourceDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  context: string[]
}
