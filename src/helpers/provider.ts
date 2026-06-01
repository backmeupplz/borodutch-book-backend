import { providers } from 'ethers'
import env from '@/helpers/env'

const alchemyRpcUrl =
  env.ALCHEMY_RPC_URL ||
  `https://eth-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`

export default new providers.JsonRpcProvider(alchemyRpcUrl, 'homestead')
