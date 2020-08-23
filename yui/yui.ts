import 'module-alias/register'
import 'reflect-metadata'
import 'config-service'

import { LOG_SCOPE, CONST_TOKEN } from '@/constants/constants'
import { errorLogger, infoLogger } from '@/handlers/log.handler'
import { YuiCore } from '@/yui-core'
import { Injector } from './decorators/injector'
;(async () => {
  try {
    infoLogger(LOG_SCOPE.YUI_MAIN, '🔸 Starting...')
    const nodeVersion = /v(\d{2})\.(\d{1,2})\.(\d{0,2})/g.exec(process.version)
    if (Number(nodeVersion[1]) < 12) {
      throw new Error(
        `Incompatible node version: You are using node version ${nodeVersion[0]}. Yui require node version >=12.00 and <13.00.`
      )
    }
    infoLogger(LOG_SCOPE.YUI_MAIN, '🔸 Yui is starting...')
    const yui = Injector.resolve<YuiCore>(YuiCore)
    await yui.start()
  } catch (error) {
    errorLogger(error, LOG_SCOPE.YUI_MAIN)
  }
})()
