import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

class ColumnSchema {
  @IsString()
  @IsNotEmpty()
  column: string

  @IsString()
  @IsNotEmpty()
  type: string

  @IsBoolean()
  @IsNotEmpty()
  selected: boolean

  @IsString()
  @IsOptional()
  description?: string
}

class TableSchema {
  @IsString()
  @IsNotEmpty()
  table: string

  @IsBoolean()
  selected: boolean

  @IsString()
  @IsOptional()
  description?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnSchema)
  columns: ColumnSchema[]
}

class SchemaSchemaDto {
  @IsString()
  @IsNotEmpty()
  schema: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableSchema)
  tables: TableSchema[]
}

export class FillTablesSchemaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchemaSchemaDto)
  schemas: SchemaSchemaDto[]
}
