import { IsNotEmpty, IsString } from 'class-validator'

export class QueryHelpDto {
  @IsString()
  @IsNotEmpty()
  query: string

  @IsString()
  @IsNotEmpty()
  error: string

  @IsString()
  @IsNotEmpty()
  dataSourceId: string
}
