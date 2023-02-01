import 'module-alias/register'
import 'source-map-support/register'

import { prepareBookEditions } from '@/helpers/book'
import runApp from '@/helpers/runApp'

void (async () => {
  console.log('Preparing book editions')
  await prepareBookEditions()
  await runApp()
})()
