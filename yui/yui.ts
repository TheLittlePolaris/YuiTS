import 'module-alias/register'
import 'reflect-metadata'
import 'config-service'

import { errorLogger } from '@/handlers/error.handler'
import YuiCore from '@/yui-core'

// Work In Progress...
;(async () => {
  console.log('Starting...')
  try {
    console.log('Yui is starting...')
    const yui = new YuiCore()
    await yui.start()
  } catch (error) {
    errorLogger(error, 'YUI_START')
  }
})()
