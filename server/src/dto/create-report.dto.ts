import { ReportDisplay } from '@prisma/client'
import { Transform, Type } from 'class-transformer'
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string

  @IsString()
  @IsNotEmpty()
  dataSourceId: string

  @IsString()
  @IsOptional()
  threadId?: string

  @IsEnum(ReportDisplay)
  @IsNotEmpty()
  display: ReportDisplay

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    return typeof value === 'object' ? JSON.stringify(value) : value
  })
  query: string

  @IsObject()
  @IsOptional()
  @Type(() => Object)
  arguments?: Record<string, string>

  @IsObject()
  @IsOptional()
  @Type(() => Object)
  customizations?: Record<string, string>
}
