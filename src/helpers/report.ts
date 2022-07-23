import bot from '@/helpers/bot'
import env from '@/helpers/env'

export default async function (message: string) {
  try {
    await bot.api.sendMessage(env.TELEGRAM_CHAT_ID, message)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
  }
}
