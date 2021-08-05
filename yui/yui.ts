import 'module-alias/register'
import 'reflect-metadata'

import { ContainerFactory } from './ioc-container/container-factory'
import { YuiLogger } from './services/logger/logger.service'
import { YuiEntryModule } from './entrypoint/yui-entry.module'

const bootstrap = async () => {
  const nodeVersion = /v(\d{1,2})\.(\d{1,2})\.(\d{0,2})/g.exec(process.version)
  if (Number(nodeVersion[1]) < 12) {
    throw new Error(
      `Incompatible node version: You are using node version ${nodeVersion[0]}. Yui require node version >=12.00 and <13.00.`
    )
  }
  const container = new ContainerFactory()

  const app = await container.createRootModule(YuiEntryModule)

  YuiLogger.info('🔸 Yui is starting...', 'BOOTSTRAP')
  app.start(container.configService.token)
}

bootstrap()
