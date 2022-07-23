import { Contract } from 'ethers'
import env from '@/helpers/env'
import erc1155abi from '@/helpers/erc1155abi'
import provider from '@/helpers/provider'

export default new Contract(env.CONTRACT_ADDRESS, erc1155abi, provider)
