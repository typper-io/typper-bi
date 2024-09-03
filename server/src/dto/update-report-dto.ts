import { ReportDisplay } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class UpdateReportDto {
  @IsString()
  @IsOptional()
  name: string

  @IsString()
  @IsOptional()
  description: string

  @IsString()
  @IsOptional()
  dataSourceId: string

  @IsString()
  @IsOptional()
  threadId?: string

  @IsEnum(ReportDisplay)
  @IsOptional()
  display: ReportDisplay

  @IsString()
  @IsOptional()
  query: string

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  arguments?: Record<string, string>

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  customizations?: Record<string, string>
}
