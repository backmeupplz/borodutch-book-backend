import { providers } from 'ethers'
import env from '@/helpers/env'

export default new providers.AlchemyProvider('homestead', env.ALCHEMY_API_KEY)
