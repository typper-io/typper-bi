import { Body, Controller, Post } from '@nestjs/common'
import { LoginAuth } from 'src/decorators/login-auth.decorator'
import { SignInOrSignUpDto } from 'src/dto/sign-in-or-signup.dto'
import { SignInService } from 'src/modules/sign-in/sign-in.service'

@LoginAuth()
@Controller()
export class SignInController {
  constructor(private readonly signInService: SignInService) {}

  @Post('/sign-in-or-sign-up')
  async signInOrSignUp(@Body() body: SignInOrSignUpDto) {
    return this.signInService.signInOrSignUp(body)
  }
}
