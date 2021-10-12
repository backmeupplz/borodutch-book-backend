import { Body, Controller, Post } from 'amala'
import { EmailModel } from '@/models/email'

@Controller('/email')
export default class LoginController {
  @Post('/')
  async facebook(@Body('email') email: string) {
    return await EmailModel.create({ email })
  }
}
