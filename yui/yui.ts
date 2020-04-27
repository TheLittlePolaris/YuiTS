import 'module-alias/register'
import 'source-map-support/register'
import 'reflect-metadata'
import 'config-service'

import { errorLogger, infoLogger } from '@/handlers/log.handler'

import YuiCore from '@/yui-core'

// Work In Progress...
import { LOG_SCOPE } from './constants/constants'
;(async () => {
  const nodeVersion = /v(\d{2})\.(\d{1,2})\.(\d{0,2})/g.exec(process.version)
  if (Number(nodeVersion[1]) < 12) {
    console.log(
      `You are using node version ${nodeVersion[0]}. Yui require node version >=12.00 and <13.00.`
    )
    return
  }

  infoLogger(LOG_SCOPE.YUI_MAIN, 'Starting...')
  try {
    infoLogger(LOG_SCOPE.YUI_MAIN, 'Yui is starting...')
    const yui = new YuiCore()
    await yui.start()
  } catch (error) {
    errorLogger(new Error(error), LOG_SCOPE.YUI_MAIN)
  }
})()
