import 'module-alias/register'
import 'source-map-support/register'
import 'reflect-metadata'
import 'config-service'

import { errorLogger, infoLogger } from '@/handlers/log.handler'

import YuiCore from '@/yui-core'

// Work In Progress...
import { LOG_SCOPE } from './constants/constants'
;(async () => {
  infoLogger(LOG_SCOPE.YUI_MAIN, 'Starting...')
  try {
    infoLogger(LOG_SCOPE.YUI_MAIN, 'Yui is starting...')
    const yui = new YuiCore()
    await yui.start()
  } catch (error) {
    errorLogger(new Error(error), LOG_SCOPE.YUI_MAIN)
  }
})()
