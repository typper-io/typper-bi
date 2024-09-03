import { Type } from 'class-transformer'
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator'

export class RunQueryDto {
  @IsString()
  @IsNotEmpty()
  dataSourceId: string

  @IsString()
  @IsNotEmpty()
  query: string

  @IsString()
  @IsOptional()
  threadId?: string

  @IsObject()
  @IsOptional()
  @Type(() => Object)
  arguments?: Record<string, string>
}
