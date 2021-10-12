import { Body, Controller, Post } from 'amala'
import { EmailModel } from '@/models/email'
import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

@Controller('/email')
export default class LoginController {
  @Post('/')
  async facebook(@Body('email') email: string) {
    await EmailModel.create({ email })
    report(`${email} has been added to the Boroudtch Book waitlist`)
  }
}

async function report(message: string) {
  try {
    await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, message)
  } catch (error) {
    console.log(error)
  }
}
