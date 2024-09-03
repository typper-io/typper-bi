import { Transform } from 'class-transformer'
import { IsArray, IsEmail, ArrayNotEmpty } from 'class-validator'

export class InviteToWorkspaceDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  @Transform(({ value }) =>
    value
      .map(
        (email: string) =>
          email.split('@')[0].split('+')[0] + '@' + email.split('@')[1],
      )
      .map((email: string) => email.trim().toLowerCase()),
  )
  emails: string[]
}
