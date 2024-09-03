import { IsNotEmpty, IsString } from 'class-validator'

export class SuggestReportDetailsDto {
  @IsString()
  @IsNotEmpty()
  query: string
}
