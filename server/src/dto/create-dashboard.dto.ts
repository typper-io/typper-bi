import { IsNotEmpty, IsString } from 'class-validator'

export class CreateDashboardDto {
  @IsString()
  @IsNotEmpty()
  name: string
}
