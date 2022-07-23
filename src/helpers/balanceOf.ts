import { BigNumber } from 'ethers'
import contract from '@/helpers/contract'
import env from '@/helpers/env'

export default function (address: string) {
  return contract.balanceOf(address, env.TOKEN_ID) as BigNumber
}
