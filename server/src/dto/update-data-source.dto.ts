import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateDataSourceDto {
  @IsString()
  @IsNotEmpty()
  dataSourceName: string
}
