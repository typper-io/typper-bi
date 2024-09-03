import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

class Layout {
  @IsString()
  i: string

  @IsNumber()
  x: number

  @IsNumber()
  y: number

  @IsNumber()
  w: number

  @IsNumber()
  h: number

  @IsNumber()
  @IsOptional()
  minW: number

  @IsNumber()
  @IsOptional()
  minH: number
}

class Widgets {
  @IsEnum(['markdown', 'report'])
  type: 'markdown' | 'report'

  @IsString()
  content: string

  @ValidateNested()
  @Type(() => Layout)
  layout: Layout

  @IsString()
  name: string
}

export class UpdateDashboardDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Widgets)
  @IsOptional()
  widgets?: Widgets[]
}
