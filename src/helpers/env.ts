import * as dotenv from 'dotenv'
import { cleanEnv, num, str } from 'envalid'
import { cwd } from 'process'
import { resolve } from 'path'

dotenv.config({ path: resolve(cwd(), '.env') })

// eslint-disable-next-line node/no-process-env
export default cleanEnv(process.env, {
  TELEGRAM_TOKEN: str(),
  TELEGRAM_CHAT_ID: num(),
  PORT: num({ default: 1337 }),
  TOKEN_ID: str({
    default:
      '86597206928702930307486193712987064466367043993614253349341663474748447785515',
  }),
  CONTRACT_ADDRESS: str({
    default: '0x495f947276749ce646f68ac8c248420045cb7b5e',
  }),
})
