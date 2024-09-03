import { IsArray, IsNotEmpty, IsString } from 'class-validator'

export class AddSchemaDataSourceDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  selectedSchemas: string[]
}
