import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator'

export class CreateDataSourceDto {
  @IsString()
  @IsNotEmpty()
  dataSourceName: string

  @ValidateIf((o) => {
    return o.provider !== 'BigQuery'
  })
  @IsString()
  @IsNotEmpty()
  url: string

  @IsString()
  @IsOptional()
  @IsEnum(['BigQuery'])
  provider?: 'BigQuery'
}
