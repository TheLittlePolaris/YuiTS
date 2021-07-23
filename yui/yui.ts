import 'module-alias/register'
import 'reflect-metadata'
import 'config-service'
import { decoratorLogger } from './ioc-container/log/logger'

import { LOG_SCOPE } from '@/constants/constants'
import { ContainerFactory } from './ioc-container/container-factory'
import { YuiMainModule } from './yui.module'
import { YuiCore } from './entrypoint/yui-core.entrypoint'
import { YuiLogger } from './log/logger.service'

const  bootstrap = async () => {
  const yuiContainerFactory = new ContainerFactory()
  await yuiContainerFactory.createRootModule(YuiMainModule)

}

YuiLogger.info('🔸 Starting...', LOG_SCOPE.YUI_MAIN)
const nodeVersion = /v(\d{1,2})\.(\d{1,2})\.(\d{0,2})/g.exec(process.version)
if (Number(nodeVersion[1]) < 12) {
  throw new Error(
    `Incompatible node version: You are using node version ${nodeVersion[0]}. Yui require node version >=12.00 and <13.00.`
  )
}
YuiLogger.info('🔸 Yui is starting...', LOG_SCOPE.YUI_MAIN)
bootstrap()
